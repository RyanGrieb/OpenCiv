package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.UnitDisembarkPacket;

public interface UnitDisembarkListener extends Listener {

	public void onUnitDisembark(WebSocket conn, UnitDisembarkPacket packet);

	public static class UnitDisembarkEvent extends Event<UnitDisembarkListener> {

		private UnitDisembarkPacket packet;
		private WebSocket conn;

		public UnitDisembarkEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(UnitDisembarkPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<UnitDisembarkListener> listeners) {
			for (UnitDisembarkListener listener : listeners) {
				listener.onUnitDisembark(conn, packet);
			}
		}

		@Override
		public Class<UnitDisembarkListener> getListenerType() {
			return UnitDisembarkListener.class;
		}

	}

}
