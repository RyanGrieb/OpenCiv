package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;

public interface SetProductionItemListener extends Listener {

	public void onSetProductionItem(SetProductionItemPacket packet);

	public static class SetProductionItemEvent extends Event<SetProductionItemListener> {

		private SetProductionItemPacket packet;

		public SetProductionItemEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SetProductionItemPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SetProductionItemListener> listeners) {
			for (SetProductionItemListener listener : listeners) {
				listener.onSetProductionItem(packet);
			}
		}

		@Override
		public Class<SetProductionItemListener> getListenerType() {
			return SetProductionItemListener.class;
		}
	}

}
