package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;

public interface RemoveQueuedProductionItemListener extends Listener {

	public void onRemoveQueuedProductionItem(RemoveQueuedProductionItemPacket packet);

	public static class RemoveQueuedProductionItemEvent extends Event<RemoveQueuedProductionItemListener> {

		private RemoveQueuedProductionItemPacket packet;

		public RemoveQueuedProductionItemEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RemoveQueuedProductionItemPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RemoveQueuedProductionItemListener> listeners) {
			for (RemoveQueuedProductionItemListener listener : listeners) {
				listener.onRemoveQueuedProductionItem(packet);
			}
		}

		@Override
		public Class<RemoveQueuedProductionItemListener> getListenerType() {
			return RemoveQueuedProductionItemListener.class;
		}
	}

}
