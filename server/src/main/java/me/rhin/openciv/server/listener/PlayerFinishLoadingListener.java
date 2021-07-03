package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface PlayerFinishLoadingListener extends Listener {

	public void onPlayerFinishLoading(WebSocket conn);

	public static class PlayerFinishLoadingEvent extends Event<PlayerFinishLoadingListener> {

		private WebSocket conn;

		public PlayerFinishLoadingEvent(PacketParameter packetParameter) {
			this.conn = packetParameter.getConn();
		}

		@Override
		public void fire(ArrayList<PlayerFinishLoadingListener> listeners) {
			for (PlayerFinishLoadingListener listener : listeners) {
				listener.onPlayerFinishLoading(conn);
			}
		}

		@Override
		public Class<PlayerFinishLoadingListener> getListenerType() {
			return PlayerFinishLoadingListener.class;
		}

	}
}
