package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;

public interface ClickSpecialistListener extends Listener {

	public void onClickSpecialist(WebSocket conn, ClickSpecialistPacket packet);

	public static class ClickSpecialistEvent extends Event<ClickSpecialistListener> {

		private ClickSpecialistPacket packet;
		private WebSocket conn;

		public ClickSpecialistEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ClickSpecialistPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ClickSpecialistListener> listeners) {
			for (ClickSpecialistListener listener : listeners) {
				listener.onClickSpecialist(conn, packet);
			}
		}

		@Override
		public Class<ClickSpecialistListener> getListenerType() {
			return ClickSpecialistListener.class;
		}

	}
}
