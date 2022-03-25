package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.MoveUpQueuedProductionItemPacket;

public interface MoveUpQueuedProductionItemListener extends Listener {

	public void onMoveUpQueuedProductionItem(WebSocket conn, MoveUpQueuedProductionItemPacket packet);

	public static class MoveUpQueuedProductionItemEvent extends Event<MoveUpQueuedProductionItemListener> {

		private MoveUpQueuedProductionItemPacket packet;
		private WebSocket conn;

		public MoveUpQueuedProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(MoveUpQueuedProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<MoveUpQueuedProductionItemListener> listeners) {
			for (MoveUpQueuedProductionItemListener listener : listeners) {
				listener.onMoveUpQueuedProductionItem(conn, packet);
			}
		}

		@Override
		public Class<MoveUpQueuedProductionItemListener> getListenerType() {
			return MoveUpQueuedProductionItemListener.class;
		}
	}
}
