package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public interface SettleCityListener extends Listener {

	public void onSettleCity(SettleCityPacket packet);

	public static class SettleCityEvent extends Event<SettleCityListener> {

		private SettleCityPacket packet;

		public SettleCityEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(SettleCityPacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<SettleCityListener> listeners) {
			for (SettleCityListener listener : listeners) {
				listener.onSettleCity(packet);
			}
		}

		@Override
		public Class<SettleCityListener> getListenerType() {
			return SettleCityListener.class;
		}
	}
}
