package me.rhin.openciv.networking;

import java.lang.reflect.Constructor;
import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.github.czyzby.websocket.WebSocket;
import com.github.czyzby.websocket.WebSocketAdapter;
import com.github.czyzby.websocket.WebSockets;
import com.github.czyzby.websocket.data.WebSocketCloseCode;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.PlayerConnectListener.PlayerConnectEvent;
import me.rhin.openciv.listener.ServerConnectListener.ServerConnectEvent;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;

public class NetworkManager {

	private WebSocket socket;
	private HashMap<Class<? extends Packet>, Class<? extends Event<? extends Listener>>> networkEvents;

	public NetworkManager() {
		networkEvents = new HashMap<>();

		networkEvents.put(PlayerConnectPacket.class, PlayerConnectEvent.class);
	}

	public void connect(String ip) {
		String socketAddress = "ws://" + ip + ":8000";
		Gdx.app.log(Civilization.LOG_TAG, "Attempting to connect to: " + socketAddress);
		try {
			this.socket = WebSockets.newSocket(socketAddress);
			socket.addListener(getListener());
			socket.connect();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

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

	public void disconnect() {
		socket.close();
	}
}
