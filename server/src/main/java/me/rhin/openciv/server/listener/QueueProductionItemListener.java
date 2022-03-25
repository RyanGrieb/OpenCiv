package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;

public interface QueueProductionItemListener extends Listener {

	public void onQueueProductionItem(WebSocket conn, QueueProductionItemPacket packet);

	public static class QueueProductionItemEvent extends Event<QueueProductionItemListener> {

		private QueueProductionItemPacket packet;
		private WebSocket conn;

		public QueueProductionItemEvent(PacketParameter packetParamter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(QueueProductionItemPacket.class, packetParamter.getPacket());
				this.conn = packetParamter.getConn();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<QueueProductionItemListener> listeners) {
			for (QueueProductionItemListener listener : listeners) {
				listener.onQueueProductionItem(conn, packet);
			}
		}

		@Override
		public Class<QueueProductionItemListener> getListenerType() {
			return QueueProductionItemListener.class;
		}
	}

}
