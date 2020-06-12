package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface MapRequestListener extends Listener {

	public void onMapRequest(WebSocket conn);

	public static class MapRequestEvent extends Event<MapRequestListener> {

		WebSocket conn;

		public MapRequestEvent(PacketParameter packetParameter) {
			this.conn = packetParameter.getConn();
		}

		@Override
		public void fire(ArrayList<MapRequestListener> listeners) {
			for (MapRequestListener listener : listeners) {
				listener.onMapRequest(conn);
			}
		}

		@Override
		public Class<MapRequestListener> getListenerType() {
			return MapRequestListener.class;
		}

	}

}
