package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;

public interface ChooseTechListener extends Listener {

	public void onChooseTech(WebSocket conn, ChooseTechPacket packet);

	public static class ChooseTechEvent extends Event<ChooseTechListener> {

		private ChooseTechPacket packet;
		private WebSocket conn;

		public ChooseTechEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ChooseTechPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ChooseTechListener> listeners) {
			for (ChooseTechListener listener : listeners) {
				listener.onChooseTech(conn, packet);
			}
		}

		@Override
		public Class<ChooseTechListener> getListenerType() {
			return ChooseTechListener.class;
		}

	}

}
