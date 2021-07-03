package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;

public interface RangedAttackListener extends Listener {

	public void onRangedAttack(WebSocket conn, RangedAttackPacket packet);

	public static class RangedAttackEvent extends Event<RangedAttackListener> {

		private RangedAttackPacket packet;
		private WebSocket conn;

		public RangedAttackEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RangedAttackPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RangedAttackListener> listeners) {
			for (RangedAttackListener listener : listeners) {
				listener.onRangedAttack(conn, packet);
			}
		}

		@Override
		public Class<RangedAttackListener> getListenerType() {
			return RangedAttackListener.class;
		}

	}
}
