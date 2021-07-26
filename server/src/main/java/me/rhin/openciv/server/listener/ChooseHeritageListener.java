package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ChooseHeritagePacket;

public interface ChooseHeritageListener extends Listener {

	public void onChooseHeritage(WebSocket conn, ChooseHeritagePacket packet);

	public static class ChooseHeritageEvent extends Event<ChooseHeritageListener> {

		private ChooseHeritagePacket packet;
		private WebSocket conn;

		public ChooseHeritageEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ChooseHeritagePacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ChooseHeritageListener> listeners) {
			for (ChooseHeritageListener listener : listeners) {
				listener.onChooseHeritage(conn, packet);
			}
		}

		@Override
		public Class<ChooseHeritageListener> getListenerType() {
			return ChooseHeritageListener.class;
		}

	}

}
