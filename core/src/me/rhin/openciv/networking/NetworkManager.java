package me.rhin.openciv.networking;

import java.lang.reflect.Constructor;
import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.github.czyzby.websocket.WebSocket;
import com.github.czyzby.websocket.WebSocketAdapter;
import com.github.czyzby.websocket.WebSockets;
import com.github.czyzby.websocket.data.WebSocketCloseCode;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.AddUnitListener.AddUnitEvent;
import me.rhin.openciv.listener.DeleteUnitListener.DeleteUnitEvent;
import me.rhin.openciv.listener.FetchPlayerListener.FetchPlayerEvent;
import me.rhin.openciv.listener.GameStartListener.GameStartEvent;
import me.rhin.openciv.listener.MoveUnitListener.MoveUnitEvent;
import me.rhin.openciv.listener.PlayerConnectListener.PlayerConnectEvent;
import me.rhin.openciv.listener.PlayerDisconnectListener.PlayerDisconnectEvent;
import me.rhin.openciv.listener.PlayerListRequestListener.PlayerListRequestEvent;
import me.rhin.openciv.listener.ReceiveMapChunkListener.ReciveMapChunkEvent;
import me.rhin.openciv.listener.SelectUnitListener.SelectUnitEvent;
import me.rhin.openciv.listener.ServerConnectListener.ServerConnectEvent;
import me.rhin.openciv.listener.SettleCityListener.SettleCityEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

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
	}

	@SuppressWarnings("unchecked")
	private void fireAssociatedPacketEvents(WebSocket webSocket, String packet) {
		JsonValue jsonValue = new JsonReader().parse(packet);
		String packetName = jsonValue.getString("packetName");

		// FIXME: The reflection done here makes GWT incompatible.
		try {
			Class<? extends Event<? extends Listener>> eventClass = networkEvents.get(Class.forName(packetName));

			Constructor<?> ctor = eventClass.getConstructor(PacketParameter.class);
			Event<? extends Listener> object = (Event<? extends Listener>) ctor
					.newInstance(new Object[] { new PacketParameter(webSocket, packet) });
			Civilization.getInstance().getEventManager().fireEvent(object);
		} catch (Exception e) {
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
				Gdx.app.log(Civilization.WS_LOG_TAG, "Got message: " + packet);
				fireAssociatedPacketEvents(webSocket, packet);
				return true;
			}
		};
	}
}
