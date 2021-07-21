package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;

public interface RequestEndTurnListener extends Listener {

	public void onRequestEndTurn(WebSocket conn, RequestEndTurnPacket packet);

	public static class RequestEndTurnEvent extends Event<RequestEndTurnListener> {

		private RequestEndTurnPacket packet;
		private WebSocket conn;

		public RequestEndTurnEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RequestEndTurnPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RequestEndTurnListener> listeners) {
			for (RequestEndTurnListener listener : listeners) {
				listener.onRequestEndTurn(conn, packet);
			}
		}

		@Override
		public Class<RequestEndTurnListener> getListenerType() {
			return RequestEndTurnListener.class;
		}

	}

}
