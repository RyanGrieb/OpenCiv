package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;

public interface FoundReligionListener extends Listener {

	public void onFoundReligion(WebSocket conn, FoundReligionPacket packet);

	public static class FoundReligionEvent extends Event<FoundReligionListener> {

		private FoundReligionPacket packet;
		private WebSocket conn;

		public FoundReligionEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(FoundReligionPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<FoundReligionListener> listeners) {
			for (FoundReligionListener listener : listeners) {
				listener.onFoundReligion(conn, packet);
			}
		}

		@Override
		public Class<FoundReligionListener> getListenerType() {
			return FoundReligionListener.class;
		}

	}

}
