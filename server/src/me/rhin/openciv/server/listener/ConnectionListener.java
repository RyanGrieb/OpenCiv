package me.rhin.openciv.server.listener;

import java.util.Queue;

import org.java_websocket.WebSocket;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ConnectionListener extends Listener {
	public void onConnection(WebSocket conn);

	public static class ConnectionEvent extends Event<ConnectionListener> {

		private WebSocket conn;

		public ConnectionEvent(WebSocket conn) {
			this.conn = conn;
		}

		@Override
		public void fire(Queue<ConnectionListener> listeners) {
			for (ConnectionListener listener : listeners) {
				listener.onConnection(conn);
			}
		}

		@Override
		public Class<ConnectionListener> getListenerType() {
			return ConnectionListener.class;
		}

	}
}
