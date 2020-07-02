package me.rhin.openciv.server.listener;

import java.util.Queue;

import org.java_websocket.WebSocket;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface DisconnectListener extends Listener {

	public void onDisconnect(WebSocket conn);

	public static class DisconnectEvent extends Event<DisconnectListener> {

		private WebSocket conn;

		public DisconnectEvent(WebSocket conn) {
			this.conn = conn;
		}

		@Override
		public void fire(Queue<DisconnectListener> listeners) {
			for (DisconnectListener listener : listeners) {
				listener.onDisconnect(conn);
			}
		}

		@Override
		public Class<DisconnectListener> getListenerType() {
			return DisconnectListener.class;
		}

	}
}
