package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.GetHostPacket;

public interface GetHostListener extends Listener {

	public void onGetHost(WebSocket conn, GetHostPacket packet);

	public static class GetHostEvent extends Event<GetHostListener> {

		private GetHostPacket packet;
		private WebSocket conn;

		public GetHostEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(GetHostPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<GetHostListener> listeners) {
			for (GetHostListener listener : listeners) {
				listener.onGetHost(conn, packet);
			}
		}

		@Override
		public Class<GetHostListener> getListenerType() {
			return GetHostListener.class;
		}

	}

}