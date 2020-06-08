package me.rhin.openciv.networking;

import com.badlogic.gdx.Gdx;
import com.github.czyzby.websocket.WebSocket;
import com.github.czyzby.websocket.WebSocketAdapter;
import com.github.czyzby.websocket.WebSockets;
import com.github.czyzby.websocket.data.WebSocketCloseCode;

import me.rhin.openciv.Civilization;

public class NetworkManager {

	// TODO: This should extend the WebSocket class.
	// TODO: We should also have a class that implements the getListener() thing
	// down there.
	private WebSocket socket;

	private void temp() {
		try {
			WebSocket socket = WebSockets.newSocket("ws://localhost:8000");
			socket.addListener(getListener());
			socket.connect();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private static WebSocketAdapter getListener() {
		return new WebSocketAdapter() {
			@Override
			public boolean onOpen(final WebSocket webSocket) {
				Gdx.app.log("WS", "Connected!");
				webSocket.send("Hello from client!");
				return true;
			}

			@Override
			public boolean onClose(final WebSocket webSocket, final WebSocketCloseCode code, final String reason) {
				Gdx.app.log("WS", "Disconnected - status: " + code + ", reason: " + reason);
				return true;
			}

			@Override
			public boolean onMessage(final WebSocket webSocket, final String packet) {
				Gdx.app.log("WS", "Got message: " + packet);
				return true;
			}
		};
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
}
