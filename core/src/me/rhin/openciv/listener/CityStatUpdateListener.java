package me.rhin.openciv.listener;

import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;

public interface CityStatUpdateListener extends Listener {

	public void onCityStatUpdate(CityStatUpdatePacket packet);

	public static class CityStatUpdateEvent extends Event<CityStatUpdateListener> {

		private CityStatUpdatePacket packet;

		public CityStatUpdateEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(CityStatUpdatePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(Queue<CityStatUpdateListener> listeners) {
			for (CityStatUpdateListener listener : listeners) {
				listener.onCityStatUpdate(packet);
			}
		}

		@Override
		public Class<CityStatUpdateListener> getListenerType() {
			return CityStatUpdateListener.class;
		}
	}

}
