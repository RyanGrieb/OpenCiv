package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityPopulationUpdatePacket;

public interface CityPopulationUpdateListener extends Listener {

	public void onCityPopulationUpdate(CityPopulationUpdatePacket packet);

	public static class CityPopulationUpdateEvent extends Event<CityPopulationUpdateListener> {

		private CityPopulationUpdatePacket packet;

		public CityPopulationUpdateEvent(PacketParameter packetParameter) {
			try {
				Json json = new Json();
				this.packet = json.fromJson(CityPopulationUpdatePacket.class, packetParameter.getPacket());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void fire(ArrayList<CityPopulationUpdateListener> listeners) {
			for (CityPopulationUpdateListener listener : listeners) {
				listener.onCityPopulationUpdate(packet);
			}
		}

		@Override
		public Class<CityPopulationUpdateListener> getListenerType() {
			return CityPopulationUpdateListener.class;
		}
	}

}
