package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface CityGrowthListener extends Listener {

	public void onCityGrowth(City city, float population, float foodSurplus);

	public static class CityGrowthEvent extends Event<CityGrowthListener> {

		private City city;
		private float population;
		private float foodSurplus;

		public CityGrowthEvent(City city, float population, float foodSurplus) {
			this.city = city;
			this.population = population;
			this.foodSurplus = foodSurplus;
		}

		@Override
		public void fire(ArrayList<CityGrowthListener> listeners) {
			for (CityGrowthListener listener : listeners) {
				listener.onCityGrowth(city, population, foodSurplus);
			}
		}

		@Override
		public Class<CityGrowthListener> getListenerType() {
			return CityGrowthListener.class;
		}

	}

}
