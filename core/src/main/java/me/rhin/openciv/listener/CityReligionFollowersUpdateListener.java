package me.rhin.openciv.listener;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.networking.PacketParameter;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;

public interface CityReligionFollowersUpdateListener extends Listener {

	public void onCityReligionFollowerUpdate(CityReligionFollowersUpdatePacket packet);

	public static class CityReligionFollowersUpdateEvent extends Event<CityReligionFollowersUpdateListener> {

		private CityReligionFollowersUpdatePacket packet;

		public CityReligionFollowersUpdateEvent(PacketParameter packetParamter) {
			Json json = new Json();
			this.packet = json.fromJson(CityReligionFollowersUpdatePacket.class, packetParamter.getPacket());
		}

		@Override
		public void fire(ArrayList<CityReligionFollowersUpdateListener> listeners) {
			for (CityReligionFollowersUpdateListener listener : listeners) {
				listener.onCityReligionFollowerUpdate(packet);
			}
		}

		@Override
		public Class<CityReligionFollowersUpdateListener> getListenerType() {
			return CityReligionFollowersUpdateListener.class;
		}
	}

}
