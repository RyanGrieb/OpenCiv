package me.rhin.openciv.server;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Scanner;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.server.command.CmdProcessor;
import me.rhin.openciv.server.events.NetworkEvent;
import me.rhin.openciv.server.events.type.ConnectionEvent;
import me.rhin.openciv.server.events.type.DisconnectEvent;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.options.GameOptions;
import me.rhin.openciv.server.game.state.InGameState;
import me.rhin.openciv.server.game.state.InLobbyState;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.CancelQueuedMovementPacket;
import me.rhin.openciv.shared.packet.type.ChangeNamePacket;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.ChooseHeritagePacket;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;
import me.rhin.openciv.shared.packet.type.EndTurnPacket;
import me.rhin.openciv.shared.packet.type.FaithBuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapRequestPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;
import me.rhin.openciv.shared.packet.type.QueuedUnitMovementPacket;
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.SpreadReligionPacket;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;
import me.rhin.openciv.shared.packet.type.TileStatlinePacket;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;
import me.rhin.openciv.shared.packet.type.UnitDisembarkPacket;
import me.rhin.openciv.shared.packet.type.UnitEmbarkPacket;
import me.rhin.openciv.shared.packet.type.UpgradeUnitPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.util.ColorHelper;

public class Server extends WebSocketServer {

	private static final Logger LOGGER = LoggerFactory.getLogger(Server.class);

	// private static final String HOST = "207.246.89.13";
	private static final String HOST = "localhost";
	private static final int PORT = 5222;
	private static Server server;

	private GameState game;
	private EventManager eventManager;
	private int playerIndex;
	private HashMap<Class<? extends Packet>, String> networkEvents;
	private CmdProcessor commandProcessor;
	private GameOptions gameOptions;
	private ArrayList<Player> players;
	private ArrayList<AIPlayer> aiPlayers;
	private ColorHelper colorHelper;

	public static void main(String[] args) {
		LOGGER.info("Starting Server...");

		// FIXME: Check for servers already running

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

		this.players = new ArrayList<>();
		this.aiPlayers = new ArrayList<>();
		this.colorHelper = new ColorHelper();

		this.game = new InLobbyState();

		this.gameOptions = new GameOptions();

		networkEvents = new HashMap<>();
		networkEvents.put(PlayerListRequestPacket.class, "onPlayerListRequested");
		networkEvents.put(MapRequestPacket.class, "onMapRequest");
		networkEvents.put(FetchPlayerPacket.class, "onPlayerFetch");
		networkEvents.put(SelectUnitPacket.class, "onUnitSelect");
		networkEvents.put(MoveUnitPacket.class, "onUnitMove");
		networkEvents.put(QueuedUnitMovementPacket.class, "onQueuedUnitMove");
		networkEvents.put(CancelQueuedMovementPacket.class, "onCancelQueuedMovement");
		networkEvents.put(StartGameRequestPacket.class, "onStartGameRequest");
		networkEvents.put(SettleCityPacket.class, "onSettleCity");
		networkEvents.put(FinishLoadingPacket.class, "onPlayerFinishLoading");
		networkEvents.put(SetProductionItemPacket.class, "onSetProductionItem");
		networkEvents.put(ClickWorkedTilePacket.class, "onClickWorkedTile");
		networkEvents.put(ClickSpecialistPacket.class, "onClickSpecialist");
		networkEvents.put(EndTurnPacket.class, "onEndTurn");
		networkEvents.put(GetHostPacket.class, "onGetHost");
		networkEvents.put(ChooseCivPacket.class, "onChooseCiv");
		networkEvents.put(SetWorldSizePacket.class, "onSetWorldSize");
		networkEvents.put(CombatPreviewPacket.class, "onCombatPreview");
		networkEvents.put(WorkTilePacket.class, "onWorkTile");
		networkEvents.put(ChooseTechPacket.class, "onChooseTech");
		networkEvents.put(RangedAttackPacket.class, "onRangedAttack");
		networkEvents.put(BuyProductionItemPacket.class, "onBuyProductionItem");
		networkEvents.put(RequestEndTurnPacket.class, "onRequestEndTurn");
		networkEvents.put(ChooseHeritagePacket.class, "onChooseHeritage");
		networkEvents.put(TradeCityPacket.class, "onTradeCity");
		networkEvents.put(SetTurnLengthPacket.class, "onSetTurnLength");
		networkEvents.put(SendChatMessagePacket.class, "onSendChatMessage");
		networkEvents.put(TileStatlinePacket.class, "onRequestTileStatline");
		networkEvents.put(UnitEmbarkPacket.class, "onUnitEmbark");
		networkEvents.put(UnitDisembarkPacket.class, "onUnitDisembark");
		networkEvents.put(DeclareWarPacket.class, "onDeclareWar");
		networkEvents.put(UpgradeUnitPacket.class, "onUpgradeUnit");
		networkEvents.put(PickPantheonPacket.class, "onPickPantheon");
		networkEvents.put(FoundReligionPacket.class, "onFoundReligion");
		networkEvents.put(FaithBuyProductionItemPacket.class, "onFaithBuyProductionItem");
		networkEvents.put(SpreadReligionPacket.class, "onSpreadReligion");
		networkEvents.put(QueueProductionItemPacket.class, "onQueueProductionItem");
		networkEvents.put(RemoveQueuedProductionItemPacket.class, "onRemoveQueuedProductionItem");
		// networkEvents.put(MoveUpQueuedProductionItemPacket.class,
		// MoveUpQueuedProductionItemEvent.class);
		// networkEvents.put(MoveDownQueuedProductionItemPacket.class,
		// MoveDownQueuedProductionItemEvent.class);
		networkEvents.put(ChangeNamePacket.class, "onChangeName");

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
		LOGGER.info("New Connection: " + conn.getRemoteSocketAddress());
		eventManager.fireEvent(new ConnectionEvent(conn));
	}

	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
		LOGGER.info("Disconnect event firing..");
		eventManager.fireEvent(new DisconnectEvent(conn));
	}

	@Override
	public void onMessage(WebSocket conn, String message) {

		if (!message.contains("TileStatlinePacket"))
			LOGGER.info("[SERVER : " + game.toString() + " - " + getPlayerByConn(conn).getName()
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
		// System.exit(0);
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

	public ArrayList<AIPlayer> getAIPlayers() {
		return aiPlayers;
	}

	public ArrayList<AbstractPlayer> getAbstractPlayers() {
		ArrayList<AbstractPlayer> abstractPlayers = new ArrayList<>();

		abstractPlayers.addAll(players);
		abstractPlayers.addAll(aiPlayers);

		return abstractPlayers;
	}

	public ColorHelper getColorHelper() {
		return colorHelper;
	}

	public GameMap getMap() {
		return getInGameState().getMap();
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
		LOGGER.debug("Packet: " + packet);
		try {
			JsonValue jsonValue = new JsonReader().parse(packet);
			String packetName = jsonValue.getString("packetName");

			Class<? extends Packet> packetClass = (Class<? extends Packet>) Class.forName(packetName);
			String methodName = networkEvents.get(packetClass);
			// Problem: We don't know what the constructor contains to create the event
			// object & fire it.
			Event eventObj = new NetworkEvent(methodName, conn, packetClass, packet);
			eventManager.fireEvent(eventObj);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	public InGameState getInGameState() {
		return (InGameState) game;
	}

	public GameOptions getGameOptions() {
		return gameOptions;
	}

	public AbstractPlayer getPlayerByName(String name) {
		for (AbstractPlayer player : getAbstractPlayers())
			if (player.getName().equals(name))
				return player;

		return null;
	}
}
