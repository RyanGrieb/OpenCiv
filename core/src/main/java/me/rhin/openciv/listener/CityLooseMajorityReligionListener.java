package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface CityLooseMajorityReligionListener extends Listener {

	public void onCityLooseMajorityReligion(City city, PlayerReligion oldReligion);

	public static class CityLooseMajorityReligionEvent extends Event<CityLooseMajorityReligionListener> {

		private City city;
		private PlayerReligion oldReligion;

		public CityLooseMajorityReligionEvent(City city, PlayerReligion newReligion) {
			this.city = city;
			this.oldReligion = newReligion;
		}

		@Override
		public void fire(ArrayList<CityLooseMajorityReligionListener> listeners) {
			for (CityLooseMajorityReligionListener listener : listeners) {
				listener.onCityLooseMajorityReligion(city, oldReligion);
			}
		}

		@Override
		public Class<CityLooseMajorityReligionListener> getListenerType() {
			return CityLooseMajorityReligionListener.class;
		}

	}

}
