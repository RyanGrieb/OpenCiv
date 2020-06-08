package me.rhin.openciv.server;

import java.net.InetSocketAddress;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import me.rhin.openciv.server.game.Game;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.ConnectionListener.ConnectionEvent;
import me.rhin.openciv.shared.listener.EventManager;

public class Server extends WebSocketServer {

	private static final String HOST = "localhost";
	private static final int PORT = 8000;
	private static Server server;

	private Game game;
	private EventManager eventManager;

	public static void main(String[] args) {
		// TODO: Implement proper logging.
		System.out.println("Starting Server...");
		server = new Server(new InetSocketAddress(HOST, PORT));
		// server.setConnectionLostTimeout(0); // Removes websocket timeout.
		server.run();
	}

	public static Server getInstance() {
		return server;
	}

	public Server(InetSocketAddress address) {
		super(address);

		this.eventManager = new EventManager();
		this.game = new Game();
		eventManager.addListener(ConnectionListener.class, game);
	}

	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		System.out.println("New Connection: " + conn.getLocalSocketAddress());
		eventManager.fireEvent(new ConnectionEvent(conn));
	}

	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
	}

	@Override
	public void onMessage(WebSocket conn, String message) {
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
	}

	@Override
	public void onStart() {
	}
}
