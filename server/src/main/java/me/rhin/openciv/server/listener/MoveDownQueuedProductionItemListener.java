package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.MoveDownQueuedProductionItemPacket;

public interface MoveDownQueuedProductionItemListener extends Listener {

	public void onMoveDownQueuedProductionItem(WebSocket conn, MoveDownQueuedProductionItemPacket packet);

	public static class MoveDownQueuedProductionItemEvent extends Event<MoveDownQueuedProductionItemListener> {

		private MoveDownQueuedProductionItemPacket packet;
		private WebSocket conn;

		public MoveDownQueuedProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(MoveDownQueuedProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<MoveDownQueuedProductionItemListener> listeners) {
			for (MoveDownQueuedProductionItemListener listener : listeners) {
				listener.onMoveDownQueuedProductionItem(conn, packet);
			}
		}

		@Override
		public Class<MoveDownQueuedProductionItemListener> getListenerType() {
			return MoveDownQueuedProductionItemListener.class;
		}
	}

}
