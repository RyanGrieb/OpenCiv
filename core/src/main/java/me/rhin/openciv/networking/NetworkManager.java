package me.rhin.openciv.networking;

import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.badlogic.gdx.utils.reflect.ClassReflection;
import com.github.czyzby.websocket.WebSocket;
import com.github.czyzby.websocket.WebSocketAdapter;
import com.github.czyzby.websocket.WebSockets;
import com.github.czyzby.websocket.data.WebSocketCloseCode;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.AddSpecialistToContainerListener.AddSpecialistToContainerEvent;
import me.rhin.openciv.listener.AddUnitListener.AddUnitEvent;
import me.rhin.openciv.listener.ApplyProductionToItemListener.ApplyProductionToItemEvent;
import me.rhin.openciv.listener.BuildingConstructedListener.BuildingConstructedEvent;
import me.rhin.openciv.listener.ChooseCivListener.ChooseCivEvent;
import me.rhin.openciv.listener.CityStatUpdateListener.CityStatUpdateEvent;
import me.rhin.openciv.listener.CombatPreviewListener.CombatPreviewEvent;
import me.rhin.openciv.listener.CompleteResearchListener.CompleteResearchEvent;
import me.rhin.openciv.listener.DeleteUnitListener.DeleteUnitEvent;
import me.rhin.openciv.listener.FetchPlayerListener.FetchPlayerEvent;
import me.rhin.openciv.listener.FinishLoadingRequestListener.FinishLoadingRequestEvent;
import me.rhin.openciv.listener.FinishProductionItemListener.FinishProductionItemEvent;
import me.rhin.openciv.listener.GameStartListener.GameStartEvent;
import me.rhin.openciv.listener.GetHostListener.GetHostEvent;
import me.rhin.openciv.listener.MoveUnitListener.MoveUnitEvent;
import me.rhin.openciv.listener.NextTurnListener.NextTurnEvent;
import me.rhin.openciv.listener.PlayerConnectListener.PlayerConnectEvent;
import me.rhin.openciv.listener.PlayerDisconnectListener.PlayerDisconnectEvent;
import me.rhin.openciv.listener.PlayerListRequestListener.PlayerListRequestEvent;
import me.rhin.openciv.listener.PlayerStatUpdateListener.PlayerStatUpdateEvent;
import me.rhin.openciv.listener.ReceiveMapChunkListener.ReciveMapChunkEvent;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener.RemoveSpecialistFromContainerEvent;
import me.rhin.openciv.listener.RemoveTileTypeListener.RemoveTileTypeEvent;
import me.rhin.openciv.listener.SelectUnitListener.SelectUnitEvent;
import me.rhin.openciv.listener.ServerConnectListener.ServerConnectEvent;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener.SetCitizenTileWorkerEvent;
import me.rhin.openciv.listener.SetCityHealthListener.SetCityHealthEvent;
import me.rhin.openciv.listener.SetCityOwnerListener.SetCityOwnerEvent;
import me.rhin.openciv.listener.SetProductionItemListener.SetProductionItemEvent;
import me.rhin.openciv.listener.SetTileTypeListener.SetTileTypeEvent;
import me.rhin.openciv.listener.SetUnitOwnerListener.SetUnitOwnerEvent;
import me.rhin.openciv.listener.SetWorldSizeListener.SetWorldSizeEvent;
import me.rhin.openciv.listener.SettleCityListener.SettleCityEvent;
import me.rhin.openciv.listener.TerritoryGrowListener.TerritoryGrowEvent;
import me.rhin.openciv.listener.TurnTimeLeftListener.TurnTimeLeftEvent;
import me.rhin.openciv.listener.UnitAttackListener.UnitAttackEvent;
import me.rhin.openciv.listener.WorkTileListener.WorkTileEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.GetHostPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class NetworkManager {

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
	}

	public void connect(String ip) {
		String socketAddress = "ws://" + ip + ":5000";
		Gdx.app.log(Civilization.LOG_TAG, "Attempting to connect to: " + socketAddress);
		try {
			this.socket = WebSockets.newSocket(socketAddress);
			socket.addListener(getListener());
			socket.connect();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void disconnect() {
		if (socket != null)
			socket.close();
	}

	public void sendPacket(Packet packet) {
		Json json = new Json();
		socket.send(json.toJson(packet));
		// Gdx.app.log(Civilization.WS_LOG_TAG, "Sending message: " +
		// packet.toString());
	}

	@SuppressWarnings("unchecked")
	private void fireAssociatedPacketEvents(WebSocket webSocket, String packet) {
		JsonValue jsonValue = new JsonReader().parse(packet);
		String packetName = jsonValue.getString("packetName");

		try {
			Class<? extends Event<? extends Listener>> eventClass = networkEvents
					.get(ClassReflection.forName(packetName));

			Event<? extends Listener> eventObj = (Event<? extends Listener>) ClassReflection
					.getConstructor(eventClass, PacketParameter.class)
					.newInstance(new PacketParameter(webSocket, packet));

			Civilization.getInstance().getEventManager().fireEvent(eventObj);
		} catch (Exception e) {
			Gdx.app.log(Civilization.WS_LOG_TAG, e.getMessage());
			e.printStackTrace();
		}

	}

	// TODO: Seperate class??
	private WebSocketAdapter getListener() {
		return new WebSocketAdapter() {
			@Override
			public boolean onOpen(final WebSocket webSocket) {
				Gdx.app.log(Civilization.WS_LOG_TAG, "Connected!");
				// webSocket.send("Hello from client!");
				Civilization.getInstance().getEventManager().fireEvent(new ServerConnectEvent());
				return true;
			}

			@Override
			public boolean onClose(final WebSocket webSocket, final WebSocketCloseCode code, final String reason) {
				Gdx.app.log(Civilization.WS_LOG_TAG, "Disconnected - status: " + code + ", reason: " + reason);
				return true;
			}

			@Override
			public boolean onMessage(final WebSocket webSocket, final String packet) {
				if (!packet.contains("MapChunkPacket") && !packet.contains("TurnTimeLeftPacket"))
					Gdx.app.log(Civilization.WS_LOG_TAG, "Got message: " + packet);
				fireAssociatedPacketEvents(webSocket, packet);
				return true;
			}
		};
	}
}
