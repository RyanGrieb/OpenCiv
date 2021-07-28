package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.RemoveProductionItemPacket;

public interface RemoveProductionItemListener extends Listener {

	public void onRemoveProductionItem(RemoveProductionItemPacket packet);

	public static class RemoveProductionItemEvent extends Event<RemoveProductionItemListener> {

		private RemoveProductionItemPacket packet;

		public RemoveProductionItemEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(RemoveProductionItemPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<RemoveProductionItemListener> listeners) {
			for (RemoveProductionItemListener listener : listeners) {
				listener.onRemoveProductionItem(packet);
			}
		}

		@Override
		public Class<RemoveProductionItemListener> getListenerType() {
			return RemoveProductionItemListener.class;
		}
	}

}
