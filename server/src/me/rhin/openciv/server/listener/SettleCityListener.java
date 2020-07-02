package me.rhin.openciv.server.listener;

import java.util.Queue;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public interface SettleCityListener extends Listener {

	public void onSettleCity(WebSocket conn, SettleCityPacket packet);

	public static class SettleCityEvent extends Event<SettleCityListener> {

		private SettleCityPacket packet;
		private WebSocket conn;

		public SettleCityEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SettleCityPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(Queue<SettleCityListener> listeners) {
			for (SettleCityListener listener : listeners) {
				listener.onSettleCity(conn, packet);
			}
		}

		@Override
		public Class<SettleCityListener> getListenerType() {
			return SettleCityListener.class;
		}

	}
}
