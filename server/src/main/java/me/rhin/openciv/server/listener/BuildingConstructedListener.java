package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface BuildingConstructedListener extends Listener {

	public void onBuildingConstructed(City city, Building building);

	public static class BuildingConstructedEvent extends Event<BuildingConstructedListener> {

		private City city;
		private Building building;

		public BuildingConstructedEvent(City city, Building building) {
			this.city = city;
			this.building = building;
		}

		@Override
		public void fire(ArrayList<BuildingConstructedListener> listeners) {
			for (BuildingConstructedListener listener : listeners) {
				listener.onBuildingConstructed(city, building);
			}
		}

		@Override
		public Class<BuildingConstructedListener> getListenerType() {
			return BuildingConstructedListener.class;
		}

	}

}
