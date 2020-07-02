package me.rhin.openciv.server.listener;

import java.util.Queue;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;

public interface SelectUnitListener extends Listener {

	public void onUnitSelect(WebSocket conn, SelectUnitPacket packet);

	public static class SelectUnitEvent extends Event<SelectUnitListener> {

		private SelectUnitPacket packet;
		private WebSocket conn;

		public SelectUnitEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SelectUnitPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<SelectUnitListener> listeners) {
			for (SelectUnitListener listener : listeners) {
				listener.onUnitSelect(conn, packet);
			}
		}

		@Override
		public Class<SelectUnitListener> getListenerType() {
			return SelectUnitListener.class;
		}

	}
}
