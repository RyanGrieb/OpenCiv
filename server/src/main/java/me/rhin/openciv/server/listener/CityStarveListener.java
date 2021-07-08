package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface CityStarveListener extends Listener {

	public void onCityStarve(City city);

	public static class CityStarveEvent extends Event<CityStarveListener> {

		private City city;

		public CityStarveEvent(City city) {
			this.city = city;
		}

		@Override
		public void fire(ArrayList<CityStarveListener> listeners) {
			for (CityStarveListener listener : listeners) {
				listener.onCityStarve(city);
			}
		}

		@Override
		public Class<CityStarveListener> getListenerType() {
			return CityStarveListener.class;
		}

	}

}
