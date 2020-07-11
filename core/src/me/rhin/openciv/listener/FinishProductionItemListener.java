package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;

public interface FinishProductionItemListener extends Listener {

	public void onFinishProductionItem(FinishProductionItemPacket packet);

	public static class FinishProductionItemEvent extends Event<FinishProductionItemListener> {

		private FinishProductionItemPacket packet;

		public FinishProductionItemEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(FinishProductionItemPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<FinishProductionItemListener> listeners) {
			for (FinishProductionItemListener listener : listeners) {
				listener.onFinishProductionItem(packet);
			}
		}

		@Override
		public Class<FinishProductionItemListener> getListenerType() {
			return FinishProductionItemListener.class;
		}
	}

}
