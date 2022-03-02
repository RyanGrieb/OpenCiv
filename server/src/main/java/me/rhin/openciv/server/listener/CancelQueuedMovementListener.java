package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CancelQueuedMovementPacket;

public interface CancelQueuedMovementListener extends Listener {

	public void onCancelQueuedMovement(WebSocket conn, CancelQueuedMovementPacket packet);

	public static class CancelQueuedMovementEvent extends Event<CancelQueuedMovementListener> {

		private CancelQueuedMovementPacket packet;
		private WebSocket conn;

		public CancelQueuedMovementEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CancelQueuedMovementPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CancelQueuedMovementListener> listeners) {
			for (CancelQueuedMovementListener listener : listeners) {
				listener.onCancelQueuedMovement(conn, packet);
			}
		}

		@Override
		public Class<CancelQueuedMovementListener> getListenerType() {
			return CancelQueuedMovementListener.class;
		}
	}

}
