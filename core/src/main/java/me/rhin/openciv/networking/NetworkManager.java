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
import me.rhin.openciv.listener.AddObservedTileListener.AddObservedTileEvent;
import me.rhin.openciv.listener.AddSpecialistToContainerListener.AddSpecialistToContainerEvent;
import me.rhin.openciv.listener.AddUnitListener.AddUnitEvent;
import me.rhin.openciv.listener.ApplyProductionToItemListener.ApplyProductionToItemEvent;
import me.rhin.openciv.listener.AttemptConnectionListener.AttemptConnectionEvent;
import me.rhin.openciv.listener.AvailablePantheonListener.AvailablePantheonEvent;
import me.rhin.openciv.listener.BuildingConstructedListener.BuildingConstructedEvent;
import me.rhin.openciv.listener.BuildingRemovedListener.BuildingRemovedEvent;
import me.rhin.openciv.listener.BuyProductionItemListener.BuyProductionItemEvent;
import me.rhin.openciv.listener.ChooseCivListener.ChooseCivEvent;
import me.rhin.openciv.listener.CityPopulationUpdateListener.CityPopulationUpdateEvent;
import me.rhin.openciv.listener.CityReligionFollowersUpdateListener.CityReligionFollowersUpdateEvent;
import me.rhin.openciv.listener.CityStatUpdateListener.CityStatUpdateEvent;
import me.rhin.openciv.listener.CombatPreviewListener.CombatPreviewEvent;
import me.rhin.openciv.listener.CompleteHeritageListener.CompleteHeritageEvent;
import me.rhin.openciv.listener.CompleteResearchListener.CompleteResearchEvent;
import me.rhin.openciv.listener.ConnectionFailedListener.ConnectionFailedEvent;
import me.rhin.openciv.listener.DeclareWarAllListener.DeclareWarAllEvent;
import me.rhin.openciv.listener.DeclareWarListener.DeclareWarEvent;
import me.rhin.openciv.listener.DeleteUnitListener.DeleteUnitEvent;
import me.rhin.openciv.listener.DiscoveredPlayerListener.DiscoveredPlayerEvent;
import me.rhin.openciv.listener.FetchPlayerListener.FetchPlayerEvent;
import me.rhin.openciv.listener.FinishLoadingRequestListener.FinishLoadingRequestEvent;
import me.rhin.openciv.listener.FinishProductionItemListener.FinishProductionItemEvent;
import me.rhin.openciv.listener.FoundReligionListener.FoundReligionEvent;
import me.rhin.openciv.listener.GameStartListener.GameStartEvent;
import me.rhin.openciv.listener.GetHostListener.GetHostEvent;
import me.rhin.openciv.listener.MoveUnitListener.MoveUnitEvent;
import me.rhin.openciv.listener.NextTurnListener.NextTurnEvent;
import me.rhin.openciv.listener.PickPantheonListener.PickPantheonEvent;
import me.rhin.openciv.listener.PlayerConnectListener.PlayerConnectEvent;
import me.rhin.openciv.listener.PlayerDisconnectListener.PlayerDisconnectEvent;
import me.rhin.openciv.listener.PlayerListRequestListener.PlayerListRequestEvent;
import me.rhin.openciv.listener.PlayerStatUpdateListener.PlayerStatUpdateEvent;
import me.rhin.openciv.listener.ReceiveMapChunkListener.ReciveMapChunkEvent;
import me.rhin.openciv.listener.RemoveObservedTileListener.RemoveObservedTileEvent;
import me.rhin.openciv.listener.RemoveProductionItemListener.RemoveProductionItemEvent;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener.RemoveSpecialistFromContainerEvent;
import me.rhin.openciv.listener.RemoveTileTypeListener.RemoveTileTypeEvent;
import me.rhin.openciv.listener.RequestEndTurnListener.RequestEndTurnEvent;
import me.rhin.openciv.listener.SelectUnitListener.SelectUnitEvent;
import me.rhin.openciv.listener.SendChatMessageListener.SendChatMessageEvent;
import me.rhin.openciv.listener.ServerConnectListener.ServerConnectEvent;
import me.rhin.openciv.listener.ServerNotificationListener.ServerNotificationEvent;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener.SetCitizenTileWorkerEvent;
import me.rhin.openciv.listener.SetCityHealthListener.SetCityHealthEvent;
import me.rhin.openciv.listener.SetCityOwnerListener.SetCityOwnerEvent;
import me.rhin.openciv.listener.SetProductionItemListener.SetProductionItemEvent;
import me.rhin.openciv.listener.SetTileTypeListener.SetTileTypeEvent;
import me.rhin.openciv.listener.SetTurnLengthListener.SetTurnLengthEvent;
import me.rhin.openciv.listener.SetUnitHealthListener.SetUnitHealthEvent;
import me.rhin.openciv.listener.SetUnitOwnerListener.SetUnitOwnerEvent;
import me.rhin.openciv.listener.SetWorldSizeListener.SetWorldSizeEvent;
import me.rhin.openciv.listener.SettleCityListener.SettleCityEvent;
import me.rhin.openciv.listener.TerritoryGrowListener.TerritoryGrowEvent;
import me.rhin.openciv.listener.TileStatlineListener.TileStatlineEvent;
import me.rhin.openciv.listener.TurnTimeLeftListener.TurnTimeLeftEvent;
import me.rhin.openciv.listener.UnitAttackListener.UnitAttackEvent;
import me.rhin.openciv.listener.WorkTileListener.WorkTileEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
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
import me.rhin.openciv.shared.packet.type.RemoveObservedTilePacket;
import me.rhin.openciv.shared.packet.type.RemoveProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
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
	private HashMap<Class<? extends Packet>, Class<? extends Event<? extends Listener>>> networkEvents;

	public NetworkManager() {
		networkEvents = new HashMap<>();

		networkEvents.put(PlayerConnectPacket.class, PlayerConnectEvent.class);
		networkEvents.put(PlayerDisconnectPacket.class, PlayerDisconnectEvent.class);
		networkEvents.put(PlayerListRequestPacket.class, PlayerListRequestEvent.class);
		networkEvents.put(MapChunkPacket.class, ReciveMapChunkEvent.class);
		networkEvents.put(GameStartPacket.class, GameStartEvent.class);
		networkEvents.put(AddUnitPacket.class, AddUnitEvent.class);
		networkEvents.put(FetchPlayerPacket.class, FetchPlayerEvent.class);
		networkEvents.put(SelectUnitPacket.class, SelectUnitEvent.class);
		networkEvents.put(MoveUnitPacket.class, MoveUnitEvent.class);
		networkEvents.put(DeleteUnitPacket.class, DeleteUnitEvent.class);
		networkEvents.put(SettleCityPacket.class, SettleCityEvent.class);
		networkEvents.put(BuildingConstructedPacket.class, BuildingConstructedEvent.class);
		networkEvents.put(BuildingRemovedPacket.class, BuildingRemovedEvent.class);
		networkEvents.put(NextTurnPacket.class, NextTurnEvent.class);
		networkEvents.put(FinishLoadingPacket.class, FinishLoadingRequestEvent.class);
		networkEvents.put(TerritoryGrowPacket.class, TerritoryGrowEvent.class);
		networkEvents.put(PlayerStatUpdatePacket.class, PlayerStatUpdateEvent.class);
		networkEvents.put(CityStatUpdatePacket.class, CityStatUpdateEvent.class);
		networkEvents.put(SetProductionItemPacket.class, SetProductionItemEvent.class);
		networkEvents.put(ApplyProductionToItemPacket.class, ApplyProductionToItemEvent.class);
		networkEvents.put(FinishProductionItemPacket.class, FinishProductionItemEvent.class);
		networkEvents.put(SetCitizenTileWorkerPacket.class, SetCitizenTileWorkerEvent.class);
		networkEvents.put(AddSpecialistToContainerPacket.class, AddSpecialistToContainerEvent.class);
		networkEvents.put(RemoveSpecialistFromContainerPacket.class, RemoveSpecialistFromContainerEvent.class);
		networkEvents.put(TurnTimeLeftPacket.class, TurnTimeLeftEvent.class);
		networkEvents.put(GetHostPacket.class, GetHostEvent.class);
		networkEvents.put(ChooseCivPacket.class, ChooseCivEvent.class);
		networkEvents.put(SetWorldSizePacket.class, SetWorldSizeEvent.class);
		networkEvents.put(CombatPreviewPacket.class, CombatPreviewEvent.class);
		networkEvents.put(UnitAttackPacket.class, UnitAttackEvent.class);
		networkEvents.put(SetUnitOwnerPacket.class, SetUnitOwnerEvent.class);
		networkEvents.put(SetCityOwnerPacket.class, SetCityOwnerEvent.class);
		networkEvents.put(SetCityHealthPacket.class, SetCityHealthEvent.class);
		networkEvents.put(WorkTilePacket.class, WorkTileEvent.class);
		networkEvents.put(SetTileTypePacket.class, SetTileTypeEvent.class);
		networkEvents.put(CompleteResearchPacket.class, CompleteResearchEvent.class);
		networkEvents.put(RemoveTileTypePacket.class, RemoveTileTypeEvent.class);
		networkEvents.put(SetUnitHealthPacket.class, SetUnitHealthEvent.class);
		networkEvents.put(RequestEndTurnPacket.class, RequestEndTurnEvent.class);
		networkEvents.put(CompleteHeritagePacket.class, CompleteHeritageEvent.class);
		networkEvents.put(RemoveProductionItemPacket.class, RemoveProductionItemEvent.class);
		networkEvents.put(SetTurnLengthPacket.class, SetTurnLengthEvent.class);
		networkEvents.put(SendChatMessagePacket.class, SendChatMessageEvent.class);
		networkEvents.put(TileStatlinePacket.class, TileStatlineEvent.class);
		networkEvents.put(BuyProductionItemPacket.class, BuyProductionItemEvent.class);
		networkEvents.put(AddObservedTilePacket.class, AddObservedTileEvent.class);
		networkEvents.put(RemoveObservedTilePacket.class, RemoveObservedTileEvent.class);
		networkEvents.put(DeclareWarPacket.class, DeclareWarEvent.class);
		networkEvents.put(DeclareWarAllPacket.class, DeclareWarAllEvent.class);
		networkEvents.put(AvailablePantheonPacket.class, AvailablePantheonEvent.class);
		networkEvents.put(PickPantheonPacket.class, PickPantheonEvent.class);
		networkEvents.put(CityReligionFollowersUpdatePacket.class, CityReligionFollowersUpdateEvent.class);
		networkEvents.put(FoundReligionPacket.class, FoundReligionEvent.class);
		networkEvents.put(CityPopulationUpdatePacket.class, CityPopulationUpdateEvent.class);
		networkEvents.put(DiscoveredPlayerPacket.class, DiscoveredPlayerEvent.class);
		networkEvents.put(ServerNotificationPacket.class, ServerNotificationEvent.class);
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

		Class<? extends Event<? extends Listener>> eventClass = null;

		try {
			eventClass = networkEvents.get(ClassReflection.forName(packetName));
		} catch (ReflectionException e) {
			LOGGER.error("Error: Reflection-1");
			e.printStackTrace();
		}

		try {
			Event<? extends Listener> eventObj = (Event<? extends Listener>) ClassReflection
					.getConstructor(eventClass, PacketParameter.class)
					.newInstance(new PacketParameter(webSocket, packet));

			Civilization.getInstance().getEventManager().fireEvent(eventObj);
		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}

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
