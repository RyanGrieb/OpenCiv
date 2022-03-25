package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;

public interface QueueProductionItemListener extends Listener {

	public void onQueueProductionItem(QueueProductionItemPacket packet);

	public static class QueueProductionItemEvent extends Event<QueueProductionItemListener> {

		private QueueProductionItemPacket packet;

		public QueueProductionItemEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(QueueProductionItemPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<QueueProductionItemListener> listeners) {
			for (QueueProductionItemListener listener : listeners) {
				listener.onQueueProductionItem(packet);
			}
		}

		@Override
		public Class<QueueProductionItemListener> getListenerType() {
			return QueueProductionItemListener.class;
		}
	}

}
