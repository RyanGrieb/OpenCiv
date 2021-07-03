package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;

public interface UnitMoveListener extends Listener {

	public void onUnitMove(WebSocket conn, MoveUnitPacket packet);

	public static class UnitMoveEvent extends Event<UnitMoveListener> {

		private MoveUnitPacket packet;
		private WebSocket conn;

		public UnitMoveEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(MoveUnitPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<UnitMoveListener> listeners) {
			for (UnitMoveListener listener : listeners) {
				listener.onUnitMove(conn, packet);
			}
		}

		@Override
		public Class<UnitMoveListener> getListenerType() {
			return UnitMoveListener.class;
		}

	}
}
