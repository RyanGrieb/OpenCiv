package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;

public interface ApplyProductionToItemListener extends Listener {

	public void onApplyProductionToItem(ApplyProductionToItemPacket packet);

	public static class ApplyProductionToItemEvent extends Event<ApplyProductionToItemListener> {

		private ApplyProductionToItemPacket packet;

		public ApplyProductionToItemEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(ApplyProductionToItemPacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<ApplyProductionToItemListener> listeners) {
			for (ApplyProductionToItemListener listener : listeners) {
				listener.onApplyProductionToItem(packet);
			}
		}

		@Override
		public Class<ApplyProductionToItemListener> getListenerType() {
			return ApplyProductionToItemListener.class;
		}
	}

}
