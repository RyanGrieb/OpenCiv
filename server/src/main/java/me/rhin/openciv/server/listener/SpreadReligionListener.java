package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SpreadReligionPacket;

public interface SpreadReligionListener extends Listener {

	public void onSpreadReligion(WebSocket conn, SpreadReligionPacket packet);

	public static class SpreadReligionEvent extends Event<SpreadReligionListener> {

		private SpreadReligionPacket packet;
		private WebSocket conn;

		public SpreadReligionEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SpreadReligionPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SpreadReligionListener> listeners) {
			for (SpreadReligionListener listener : listeners) {
				listener.onSpreadReligion(conn, packet);
			}
		}

		@Override
		public Class<SpreadReligionListener> getListenerType() {
			return SpreadReligionListener.class;
		}

	}

}
