package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.EndTurnPacket;

public interface EndTurnListener extends Listener {

	public void onEndTurn(WebSocket conn, EndTurnPacket packet);

	public static class EndTurnEvent extends Event<EndTurnListener> {

		private EndTurnPacket packet;
		private WebSocket conn;

		public EndTurnEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(EndTurnPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<EndTurnListener> listeners) {
			for (EndTurnListener listener : listeners) {
				listener.onEndTurn(conn, packet);
			}
		}

		@Override
		public Class<EndTurnListener> getListenerType() {
			return EndTurnListener.class;
		}

	}

}
