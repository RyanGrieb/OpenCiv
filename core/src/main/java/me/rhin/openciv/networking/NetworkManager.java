package me.rhin.openciv.networking;

import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.badlogic.gdx.utils.reflect.ClassReflection;
import com.badlogic.gdx.utils.reflect.ReflectionException;
import com.github.czyzby.websocket.WebSocket;
import com.github.czyzby.websocket.WebSocketAdapter;
import com.github.czyzby.websocket.WebSockets;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.NetworkEvent;
import me.rhin.openciv.events.type.AttemptConnectionEvent;
import me.rhin.openciv.events.type.ConnectionFailedEvent;
import me.rhin.openciv.events.type.ServerConnectEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.AddObservedTilePacket;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.AvailablePantheonPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.BuildingRemovedPacket;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.CityPopulationUpdatePacket;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.DeclareWarAllPacket;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.DiscoveredPlayerPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveObservedTilePacket;
import me.rhin.openciv.shared.packet.type.RemoveProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;
import me.rhin.openciv.shared.packet.type.ServerNotificationPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.TileStatlinePacket;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class NetworkManager {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.WS_LOG_TAG);

	private WebSocket socket;
	private HashMap<Class<? extends Packet>, String> networkEvents;

	public NetworkManager() {
		networkEvents = new HashMap<>();

		networkEvents.put(PlayerConnectPacket.class, "onPlayerConnect");
		networkEvents.put(PlayerDisconnectPacket.class, "onPlayerDisconnect");
		networkEvents.put(PlayerListRequestPacket.class, "onPlayerListRequested");
		networkEvents.put(MapChunkPacket.class, "onReceiveMapChunk");
		networkEvents.put(GameStartPacket.class, "onGameStart");
		networkEvents.put(AddUnitPacket.class, "onUnitAdd");
		networkEvents.put(FetchPlayerPacket.class, "onFetchPlayer");
		// networkEvents.put(SelectUnitPacket.class, SelectUnitEvent.class);
		networkEvents.put(MoveUnitPacket.class, "onUnitMove");
		networkEvents.put(DeleteUnitPacket.class, "onUnitDelete");
		networkEvents.put(SettleCityPacket.class, "onSettleCity");
		networkEvents.put(BuildingConstructedPacket.class, "onBuildingConstructed");
		networkEvents.put(BuildingRemovedPacket.class, "onBuildingRemoved");
		networkEvents.put(NextTurnPacket.class, "onNextTurn");
		networkEvents.put(FinishLoadingPacket.class, "onFinishLoadingRequest");
		networkEvents.put(TerritoryGrowPacket.class, "onTerritoryGrow");
		networkEvents.put(PlayerStatUpdatePacket.class, "onPlayerStatUpdate");
		networkEvents.put(CityStatUpdatePacket.class, "onCityStatUpdate");
		networkEvents.put(SetProductionItemPacket.class, "onSetProductionItem");
		networkEvents.put(ApplyProductionToItemPacket.class, "onApplyProductionToItem");
		networkEvents.put(FinishProductionItemPacket.class, "onFinishProductionItem");
		networkEvents.put(SetCitizenTileWorkerPacket.class, "onSetCitizenTileWorker");
		networkEvents.put(AddSpecialistToContainerPacket.class, "onAddSpecialistToContainer");
		networkEvents.put(RemoveSpecialistFromContainerPacket.class, "onRemoveSpecialistFromContainer");
		networkEvents.put(TurnTimeLeftPacket.class, "onTurnTimeLeftPacket");
		networkEvents.put(GetHostPacket.class, "onGetHost");
		networkEvents.put(ChooseCivPacket.class, "onChooseCiv");
		networkEvents.put(SetWorldSizePacket.class, "onSetWorldSize");
		networkEvents.put(CombatPreviewPacket.class, "onCombatPreview");
		networkEvents.put(UnitAttackPacket.class, "onUnitAttack");
		networkEvents.put(SetUnitOwnerPacket.class, "onSetUnitOwner");
		networkEvents.put(SetCityOwnerPacket.class, "onSetCityOwner");
		networkEvents.put(SetCityHealthPacket.class, "onSetCityHelath");
		networkEvents.put(WorkTilePacket.class, "onWorkTile");
		networkEvents.put(SetTileTypePacket.class, "onSetTileType");
		networkEvents.put(CompleteResearchPacket.class, "onCompleteResearch");
		networkEvents.put(RemoveTileTypePacket.class, "onRemoveTileType");
		networkEvents.put(SetUnitHealthPacket.class, "onSetUnitHealth");
		networkEvents.put(RequestEndTurnPacket.class, "onRequestEndTurn");
		networkEvents.put(CompleteHeritagePacket.class, "onCompleteHeritagePacket");
		networkEvents.put(RemoveProductionItemPacket.class, "onRemoveProductionItemPacket");
		networkEvents.put(SetTurnLengthPacket.class, "onSetTurnLength");
		networkEvents.put(SendChatMessagePacket.class, "onSendChatMessage");
		networkEvents.put(TileStatlinePacket.class, "onRecieveTileStatline");
		networkEvents.put(BuyProductionItemPacket.class, "onBuyProductionItem");
		networkEvents.put(AddObservedTilePacket.class, "onAddObservedTilePacket");
		networkEvents.put(RemoveObservedTilePacket.class, "onRemoveObservedTilePacket");
		networkEvents.put(DeclareWarPacket.class, "onDelcareWar");
		networkEvents.put(DeclareWarAllPacket.class, "onDeclareWarAll");
		networkEvents.put(AvailablePantheonPacket.class, "onAvailablePantheon");
		networkEvents.put(PickPantheonPacket.class, "onPickPantheon");
		networkEvents.put(CityReligionFollowersUpdatePacket.class, "onCityReligionFollowersUpdate");
		networkEvents.put(FoundReligionPacket.class, "onFoundReligion");
		networkEvents.put(CityPopulationUpdatePacket.class, "onCityPopulationUpdate");
		networkEvents.put(DiscoveredPlayerPacket.class, "onDiscoveredPlayer");
		networkEvents.put(ServerNotificationPacket.class, "onServerNotification");
		networkEvents.put(QueueProductionItemPacket.class, "onQueueProductionItem");
		networkEvents.put(RemoveQueuedProductionItemPacket.class, "onRemoveQueuedProductionItem");
	}

	public void connect(String ip) {
		String socketAddress = "ws://" + ip + ":5222";
		LOGGER.info("Attempting to connect to: " + socketAddress);
		try {
			this.socket = WebSockets.newSocket(socketAddress);
			// socket.setSendGracefully(true);
			socket.addListener(getListener());
			socket.connect();

			Civilization.getInstance().getEventManager().fireEvent(new AttemptConnectionEvent());
		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}
	}

	public void disconnect() {
		if (socket != null)
			socket.close();
	}

	public void sendPacket(Packet packet) {
		Json json = new Json();
		socket.send(json.toJson(packet));
	}

	private void fireAssociatedPacketEvents(WebSocket webSocket, String packet) {
		JsonValue jsonValue = new JsonReader().parse(packet);
		String packetName = jsonValue.getString("packetName");
		Class<? extends Packet> packetClass = null;

		try {
			packetClass = ClassReflection.forName(packetName);
		} catch (ReflectionException e) {
			LOGGER.error("Error: Reflection-1");
			e.printStackTrace();
		}

		String methodName = networkEvents.get(packetClass);

		Event eventObj = new NetworkEvent(methodName, packetClass, packet);
		Civilization.getInstance().getEventManager().fireEvent(eventObj);
	}

	// TODO: Seperate class??
	private WebSocketAdapter getListener() {
		return new WebSocketAdapter() {
			@Override
			public boolean onOpen(final WebSocket webSocket) {
				LOGGER.info("Connected!");
				Civilization.getInstance().getEventManager().fireEvent(new ServerConnectEvent());
				return true;
			}

			@Override
			public boolean onClose(final WebSocket webSocket, final int closeCode, final String reason) {
				LOGGER.info("Disconnected - status: " + closeCode + ", reason: " + reason);
				Civilization.getInstance().getEventManager().fireEvent(new ConnectionFailedEvent());
				return true;
			}

			@Override
			public boolean onMessage(final WebSocket webSocket, final String packet) {
				if (!packet.contains("MapChunkPacket") && !packet.contains("TurnTimeLeftPacket")
						&& !packet.contains("TileStatlinePacket"))
					LOGGER.info("Got message: " + packet);

				// Fire events on the LibGDX thread instead of the network thread.
				Gdx.app.postRunnable(() -> fireAssociatedPacketEvents(webSocket, packet));

				return true;
			}
		};
	}
}
