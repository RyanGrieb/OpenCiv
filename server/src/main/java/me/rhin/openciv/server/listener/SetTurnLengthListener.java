package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;

public interface SetTurnLengthListener extends Listener {

	public void onSetTurnLength(WebSocket conn, SetTurnLengthPacket packet);

	public static class SetTurnLengthEvent extends Event<SetTurnLengthListener> {

		private SetTurnLengthPacket packet;
		private WebSocket conn;

		public SetTurnLengthEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(SetTurnLengthPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<SetTurnLengthListener> listeners) {
			for (SetTurnLengthListener listener : listeners) {
				listener.onSetTurnLength(conn, packet);
			}
		}

		@Override
		public Class<SetTurnLengthListener> getListenerType() {
			return SetTurnLengthListener.class;
		}

	}

}