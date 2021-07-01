package me.rhin.openciv.server;

import java.lang.reflect.Constructor;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Scanner;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.github.czyzby.websocket.CommonWebSockets;
import com.github.czyzby.websocket.WebSocketAdapter;

import me.rhin.openciv.server.command.CmdProcessor;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.state.InLobbyState;
import me.rhin.openciv.server.listener.ChooseCivListener.ChooseCivEvent;
import me.rhin.openciv.server.listener.ChooseTechListener.ChooseTechEvent;
import me.rhin.openciv.server.listener.ClickSpecialistListener.ClickSpecialistEvent;
import me.rhin.openciv.server.listener.ClickWorkedTileListener.ClickWorkedTileEvent;
import me.rhin.openciv.server.listener.CombatPreviewListener.CombatPreviewEvent;
import me.rhin.openciv.server.listener.ConnectionListener.ConnectionEvent;
import me.rhin.openciv.server.listener.DisconnectListener.DisconnectEvent;
import me.rhin.openciv.server.listener.EndTurnListener.EndTurnEvent;
import me.rhin.openciv.server.listener.FetchPlayerListener.FetchPlayerEvent;
import me.rhin.openciv.server.listener.GetHostListener.GetHostEvent;
import me.rhin.openciv.server.listener.MapRequestListener.MapRequestEvent;
import me.rhin.openciv.server.listener.PlayerFinishLoadingListener.PlayerFinishLoadingEvent;
import me.rhin.openciv.server.listener.PlayerListRequestListener.PlayerListRequestEvent;
import me.rhin.openciv.server.listener.RangedAttackListener.RangedAttackEvent;
import me.rhin.openciv.server.listener.SelectUnitListener.SelectUnitEvent;
import me.rhin.openciv.server.listener.SetProductionItemListener.SetProductionItemEvent;
import me.rhin.openciv.server.listener.SetWorldSizeListener.SetWorldSizeEvent;
import me.rhin.openciv.server.listener.SettleCityListener.SettleCityEvent;
import me.rhin.openciv.server.listener.StartGameRequestListener.StartGameRequestEvent;
import me.rhin.openciv.server.listener.UnitMoveListener.UnitMoveEvent;
import me.rhin.openciv.server.listener.WorkTileListener.WorkTileEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.EndTurnPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapRequestPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.util.ColorHelper;

public class Server extends WebSocketServer {

	// private static final String HOST = "192.168.1.77";
	private static final String HOST = "localhost";
	private static final int PORT = 5000;
	private static Server server;

	private GameState game;
	private EventManager eventManager;
	private int playerIndex;
	private HashMap<Class<? extends Packet>, Class<? extends Event<? extends Listener>>> networkEvents;
	private CmdProcessor commandProcessor;
	private GameMap map;
	private ArrayList<Player> players;
	private ColorHelper colorHelper;

	public static void main(String[] args) {
		// TODO: Implement proper logging.
		System.out.println("Starting Server...");

		// Check for servers already running
		checkExistingServers();

		// FIXME: The server should only be initialized when we are 100% sure there are
		// no other existing servers

		Server server = new Server(new InetSocketAddress(HOST, PORT));
		// server.setConnectionLostTimeout(0); // Removes websocket timeout.
		server.run();
	}

	public static Server getInstance() {
		return server;
	}

	public Server(InetSocketAddress address) {
		super(address);
		server = this;

		this.eventManager = new EventManager();

		this.map = new GameMap();
		this.players = new ArrayList<>();
		this.colorHelper = new ColorHelper();

		this.game = new InLobbyState();

		networkEvents = new HashMap<>();
		networkEvents.put(PlayerListRequestPacket.class, PlayerListRequestEvent.class);
		networkEvents.put(MapRequestPacket.class, MapRequestEvent.class);
		networkEvents.put(FetchPlayerPacket.class, FetchPlayerEvent.class);
		networkEvents.put(SelectUnitPacket.class, SelectUnitEvent.class);
		networkEvents.put(MoveUnitPacket.class, UnitMoveEvent.class);
		networkEvents.put(StartGameRequestPacket.class, StartGameRequestEvent.class);
		networkEvents.put(SettleCityPacket.class, SettleCityEvent.class);
		networkEvents.put(FinishLoadingPacket.class, PlayerFinishLoadingEvent.class);
		networkEvents.put(SetProductionItemPacket.class, SetProductionItemEvent.class);
		networkEvents.put(ClickWorkedTilePacket.class, ClickWorkedTileEvent.class);
		networkEvents.put(ClickSpecialistPacket.class, ClickSpecialistEvent.class);
		networkEvents.put(EndTurnPacket.class, EndTurnEvent.class);
		networkEvents.put(GetHostPacket.class, GetHostEvent.class);
		networkEvents.put(ChooseCivPacket.class, ChooseCivEvent.class);
		networkEvents.put(SetWorldSizePacket.class, SetWorldSizeEvent.class);
		networkEvents.put(CombatPreviewPacket.class, CombatPreviewEvent.class);
		networkEvents.put(WorkTilePacket.class, WorkTileEvent.class);
		networkEvents.put(ChooseTechPacket.class, ChooseTechEvent.class);
		networkEvents.put(RangedAttackPacket.class, RangedAttackEvent.class);

		this.playerIndex = 0;
		this.commandProcessor = new CmdProcessor();

		// FIXME: Move this to a more suitable location
		Thread t1 = new Thread(new Runnable() {
			Scanner scanner = new Scanner(System.in);

			@Override
			public void run() {
				while (scanner.hasNext()) {
					String input = scanner.nextLine();
					Server.getInstance().getCommandProcessor().proccessCommand(input);
				}

				scanner.close();

			}
		});
		t1.start();
	}

	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		playerIndex++;
		System.out.println("New Connection: " + conn.getLocalSocketAddress());
		eventManager.fireEvent(new ConnectionEvent(conn));
	}

	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
		System.out.println("Disconnect event firing..");
		eventManager.fireEvent(new DisconnectEvent(conn));
	}

	@Override
	public void onMessage(WebSocket conn, String message) {
		System.out.println("[SERVER : " + game.toString() + " - " + getPlayerByConn(conn).getName()
				+ "] Received Message: " + message);
		fireAssociatedPacketEvents(conn, message);
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
	}

	@Override
	public void onStart() {
	}

	@Override
	public void stop() {
		/*
		 * Note: It's a known bug on linux that java programs hang when we exit out of
		 * them. Just wait a few seconds
		 * https://bugs.java.com/bugdatabase/view_bug.do?bug_id=4656697
		 */
		System.exit(0);
	}

	public Player getPlayerByConn(WebSocket conn) {
		for (Player player : players)
			if (player.getConn().equals(conn))
				return player;

		return null;
	}

	public ArrayList<Player> getPlayers() {
		return players;
	}

	public ColorHelper getColorHelper() {
		return colorHelper;
	}

	public GameMap getMap() {
		return map;
	}

	public int getPlayerIndex() {
		return playerIndex;
	}

	public GameState getGame() {
		return game;
	}

	public CmdProcessor getCommandProcessor() {
		return commandProcessor;
	}

	public EventManager getEventManager() {
		return eventManager;
	}

	public void setGameState(GameState game) {
		this.game.onStateEnd();
		this.game = game;
		this.game.onStateBegin();
	}

	@SuppressWarnings("unchecked")
	private void fireAssociatedPacketEvents(WebSocket conn, String packet) {
		try {
			JsonValue jsonValue = new JsonReader().parse(packet);
			String packetName = jsonValue.getString("packetName");

			Class<? extends Event<? extends Listener>> eventClass = networkEvents.get(Class.forName(packetName));

			Constructor<?> ctor = eventClass.getConstructor(PacketParameter.class);
			Event<? extends Listener> object = (Event<? extends Listener>) ctor
					.newInstance(new Object[] { new PacketParameter(conn, packet) });
			eventManager.fireEvent(object);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	private static void checkExistingServers() {
		CommonWebSockets.initiate();
		String socketAddress = "ws://" + HOST + ":" + PORT;
		try {
			com.github.czyzby.websocket.WebSocket socket = com.github.czyzby.websocket.WebSockets
					.newSocket(socketAddress);
			socket.addListener(existingServerListener());
			socket.connect();
		} catch (Exception e) {
			// e.printStackTrace();
		}
	}

	private static WebSocketAdapter existingServerListener() {
		return new WebSocketAdapter() {
			@Override
			public boolean onOpen(final com.github.czyzby.websocket.WebSocket webSocket) {
				try {
					System.out.println("[SERVER] Another server already running, exiting...");
					System.exit(0);
				} catch (Exception e) {
					e.printStackTrace();
				}
				return true;
			}
		};
	}
}
