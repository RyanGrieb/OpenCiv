package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public interface PickPantheonListener extends Listener {

	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet);

	public static class PickPantheonEvent extends Event<PickPantheonListener> {

		private PickPantheonPacket packet;
		private WebSocket conn;

		public PickPantheonEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(PickPantheonPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<PickPantheonListener> listeners) {
			for (PickPantheonListener listener : listeners) {
				listener.onPickPantheon(conn, packet);
			}
		}

		@Override
		public Class<PickPantheonListener> getListenerType() {
			return PickPantheonListener.class;
		}

	}

}
