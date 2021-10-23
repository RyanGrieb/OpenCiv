package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface TerritoryGrowListener extends Listener {

	public void onTerritoryGrow(City city, Tile territory);

	public static class TerritoryGrowEvent extends Event<TerritoryGrowListener> {

		private City city;
		private Tile territory;

		public TerritoryGrowEvent(City city, Tile territory) {
			this.city = city;
			this.territory = territory;
		}

		@Override
		public void fire(ArrayList<TerritoryGrowListener> listeners) {
			for (TerritoryGrowListener listener : listeners) {
				listener.onTerritoryGrow(city,territory);
			}
		}

		@Override
		public Class<TerritoryGrowListener> getListenerType() {
			return TerritoryGrowListener.class;
		}

	}
}
