package me.rhin.openciv.server;

import java.lang.reflect.Constructor;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Scanner;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.server.command.CmdProcessor;
import me.rhin.openciv.server.game.Game;
import me.rhin.openciv.server.listener.ConnectionListener.ConnectionEvent;
import me.rhin.openciv.server.listener.DisconnectListener.DisconnectEvent;
import me.rhin.openciv.server.listener.FetchPlayerListener.FetchPlayerEvent;
import me.rhin.openciv.server.listener.MapRequestListener.MapRequestEvent;
import me.rhin.openciv.server.listener.PlayerListRequestListener.PlayerListRequestEvent;
import me.rhin.openciv.server.listener.SelectUnitListener.SelectUnitEvent;
import me.rhin.openciv.server.listener.SettleCityListener.SettleCityEvent;
import me.rhin.openciv.server.listener.StartGameRequestListener.StartGameRequestEvent;
import me.rhin.openciv.server.listener.UnitMoveListener.UnitMoveEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.MapRequestPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;

public class Server extends WebSocketServer {

	// private static final String HOST = "192.168.1.77";
	private static final String HOST = "localhost";
	private static final int PORT = 5000;
	private static Server server;

	private Game game;
	private EventManager eventManager;
	private int playerIndex;
	private HashMap<Class<? extends Packet>, Class<? extends Event<? extends Listener>>> networkEvents;
	private CmdProcessor commandProcessor;

	public static void main(String[] args) {
		// TODO: Implement proper logging.
		System.out.println("Starting Server...");
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
		this.game = new Game();

		networkEvents = new HashMap<>();
		networkEvents.put(PlayerListRequestPacket.class, PlayerListRequestEvent.class);
		networkEvents.put(MapRequestPacket.class, MapRequestEvent.class);
		networkEvents.put(FetchPlayerPacket.class, FetchPlayerEvent.class);
		networkEvents.put(SelectUnitPacket.class, SelectUnitEvent.class);
		networkEvents.put(MoveUnitPacket.class, UnitMoveEvent.class);
		networkEvents.put(StartGameRequestPacket.class, StartGameRequestEvent.class);
		networkEvents.put(SettleCityPacket.class, SettleCityEvent.class);

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
		System.out.println("[SERVER] Received Message: " + message);
		fireAssociatedPacketEvents(conn, message);
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
	}

	@Override
	public void onStart() {
	}

	public int getPlayerIndex() {
		return playerIndex;
	}

	public Game getGame() {
		return game;
	}

	public CmdProcessor getCommandProcessor() {
		return commandProcessor;
	}

	public EventManager getEventManager() {
		return eventManager;
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

}
