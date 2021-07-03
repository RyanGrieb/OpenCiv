package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ChooseCivPacket;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;

public interface ChooseCivListener extends Listener {

	public void onChooseCiv(WebSocket conn, ChooseCivPacket packet);

	public static class ChooseCivEvent extends Event<ChooseCivListener> {

		private ChooseCivPacket packet;
		private WebSocket conn;

		public ChooseCivEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ChooseCivPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ChooseCivListener> listeners) {
			for (ChooseCivListener listener : listeners) {
				listener.onChooseCiv(conn, packet);
			}
		}

		@Override
		public Class<ChooseCivListener> getListenerType() {
			return ChooseCivListener.class;
		}

	}
}