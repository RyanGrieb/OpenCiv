package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface CityGrowthListener extends Listener {

	public void onCityGrowth(City city);

	public static class CityGrowthEvent extends Event<CityGrowthListener> {

		private City city;

		public CityGrowthEvent(City city) {
			this.city = city;
		}

		@Override
		public void fire(ArrayList<CityGrowthListener> listeners) {
			for (CityGrowthListener listener : listeners) {
				listener.onCityGrowth(city);
			}
		}

		@Override
		public Class<CityGrowthListener> getListenerType() {
			return CityGrowthListener.class;
		}

	}

}
