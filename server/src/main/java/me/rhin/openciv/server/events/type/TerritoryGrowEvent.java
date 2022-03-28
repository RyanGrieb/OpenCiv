package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.Event;

public class TerritoryGrowEvent implements Event {

	private City city;
	private Tile tile;

	public TerritoryGrowEvent(City city, Tile tile) {
		this.city = city;
		this.tile = tile;
	}

	@Override
	public String getMethodName() {
		return "onTerritoryGrow";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, tile };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), tile.getClass() };
	}

}
