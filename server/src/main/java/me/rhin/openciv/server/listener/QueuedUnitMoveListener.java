package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.QueuedUnitMovementPacket;

public interface QueuedUnitMoveListener extends Listener {

	public void onQueuedUnitMove(WebSocket conn, QueuedUnitMovementPacket packet);

	public static class QueuedUnitMoveEvent extends Event<QueuedUnitMoveListener> {

		private QueuedUnitMovementPacket packet;
		private WebSocket conn;

		public QueuedUnitMoveEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(QueuedUnitMovementPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<QueuedUnitMoveListener> listeners) {
			for (QueuedUnitMoveListener listener : listeners) {
				listener.onQueuedUnitMove(conn, packet);
			}
		}

		@Override
		public Class<QueuedUnitMoveListener> getListenerType() {
			return QueuedUnitMoveListener.class;
		}

	}

}
