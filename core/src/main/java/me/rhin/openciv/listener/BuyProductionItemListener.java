package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;

public interface BuyProductionItemListener extends Listener {

	public void onBuyProductionItem(BuyProductionItemPacket packet);

	public static class BuyProductionItemEvent extends Event<BuyProductionItemListener> {

		private BuyProductionItemPacket packet;

		public BuyProductionItemEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(BuyProductionItemPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<BuyProductionItemListener> listeners) {
			for (BuyProductionItemListener listener : listeners) {
				listener.onBuyProductionItem(packet);
			}
		}

		@Override
		public Class<BuyProductionItemListener> getListenerType() {
			return BuyProductionItemListener.class;
		}
	}

}
