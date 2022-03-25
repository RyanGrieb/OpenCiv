package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;

public interface RemoveQueuedProductionItemListener extends Listener {

	public void onRemoveQueuedProductionItem(WebSocket conn, RemoveQueuedProductionItemPacket packet);

	public static class RemoveQueuedProductionItemEvent extends Event<RemoveQueuedProductionItemListener> {

		private RemoveQueuedProductionItemPacket packet;
		private WebSocket conn;

		public RemoveQueuedProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RemoveQueuedProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RemoveQueuedProductionItemListener> listeners) {
			for (RemoveQueuedProductionItemListener listener : listeners) {
				listener.onRemoveQueuedProductionItem(conn, packet);
			}
		}

		@Override
		public Class<RemoveQueuedProductionItemListener> getListenerType() {
			return RemoveQueuedProductionItemListener.class;
		}
	}

}
