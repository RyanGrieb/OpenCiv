package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public interface CityGainMajorityReligionListener extends Listener {

	void onCityGainMajorityReligion(City city, PlayerReligion newReligion);

	public static class CityGainMajorityReligionEvent extends Event<CityGainMajorityReligionListener> {
		private final Logger LOGGER = LoggerFactory.getLogger(CityGainMajorityReligionEvent.class);

		private City city;
		private PlayerReligion newReligion;

		public CityGainMajorityReligionEvent(City city, PlayerReligion newReligion) {
			LOGGER.info(city.getName() + " Gained majority - " + newReligion.getReligionIcon().name());
			this.city = city;
			this.newReligion = newReligion;
		}

		@Override
		public void fire(ArrayList<CityGainMajorityReligionListener> listeners) {
			for (CityGainMajorityReligionListener listener : listeners) {
				listener.onCityGainMajorityReligion(city, newReligion);
			}
		}

		@Override
		public Class<CityGainMajorityReligionListener> getListenerType() {
			return CityGainMajorityReligionListener.class;
		}

	}
}
