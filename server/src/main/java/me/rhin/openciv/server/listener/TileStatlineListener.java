package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.TileStatlinePacket;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;

public interface TileStatlineListener extends Listener {

	public void onRequestTileStatline(WebSocket conn, TileStatlinePacket packet);

	public static class TileStatlineEvent extends Event<TileStatlineListener> {

		private TileStatlinePacket packet;
		private WebSocket conn;

		public TileStatlineEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(TileStatlinePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<TileStatlineListener> listeners) {
			for (TileStatlineListener listener : listeners) {
				listener.onRequestTileStatline(conn, packet);
			}
		}

		@Override
		public Class<TileStatlineListener> getListenerType() {
			return TileStatlineListener.class;
		}

	}

}
