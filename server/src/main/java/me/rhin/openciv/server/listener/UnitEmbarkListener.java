package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.UnitEmbarkPacket;

public interface UnitEmbarkListener extends Listener {

	public void onUnitEmbark(WebSocket conn, UnitEmbarkPacket packet);

	public static class UnitEmbarkEvent extends Event<UnitEmbarkListener> {

		private UnitEmbarkPacket packet;
		private WebSocket conn;

		public UnitEmbarkEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(UnitEmbarkPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<UnitEmbarkListener> listeners) {
			for (UnitEmbarkListener listener : listeners) {
				listener.onUnitEmbark(conn, packet);
			}
		}

		@Override
		public Class<UnitEmbarkListener> getListenerType() {
			return UnitEmbarkListener.class;
		}

	}

}
