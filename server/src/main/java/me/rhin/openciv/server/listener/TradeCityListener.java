package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;

public interface TradeCityListener extends Listener {

	public void onTradeCity(WebSocket conn, TradeCityPacket packet);

	public static class TradeCityEvent extends Event<TradeCityListener> {

		private TradeCityPacket packet;
		private WebSocket conn;

		public TradeCityEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(TradeCityPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<TradeCityListener> listeners) {
			for (TradeCityListener listener : listeners) {
				listener.onTradeCity(conn, packet);
			}
		}

		@Override
		public Class<TradeCityListener> getListenerType() {
			return TradeCityListener.class;
		}

	}

}
