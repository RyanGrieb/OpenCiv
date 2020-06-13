package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface StartGameRequestListener extends Listener {

	public void onStartGameRequest(WebSocket conn);

	public static class StartGameRequestEvent extends Event<StartGameRequestListener> {

		private WebSocket conn;

		public StartGameRequestEvent() {
			this.conn = null;
		}

		public StartGameRequestEvent(PacketParameter packetParameter) {
			this.conn = packetParameter.getConn();
		}

		@Override
		public void fire(ArrayList<StartGameRequestListener> listeners) {
			for (StartGameRequestListener listener : listeners) {
				listener.onStartGameRequest(conn);
			}
		}

		@Override
		public Class<StartGameRequestListener> getListenerType() {
			return StartGameRequestListener.class;
		}

	}

}
