package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;

public interface DeclareWarListener extends Listener {

	public void onDeclareWar(WebSocket conn, DeclareWarPacket packet);

	public static class DeclareWarEvent extends Event<DeclareWarListener> {

		private DeclareWarPacket packet;
		private WebSocket conn;

		public DeclareWarEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(DeclareWarPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<DeclareWarListener> listeners) {
			for (DeclareWarListener listener : listeners) {
				listener.onDeclareWar(conn, packet);
			}
		}

		@Override
		public Class<DeclareWarListener> getListenerType() {
			return DeclareWarListener.class;
		}

	}

}
