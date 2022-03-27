package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.listener.Event;

public class BuildingConstructedEvent implements Event {

	private City city;
	private Building building;

	public BuildingConstructedEvent(City city, Building building) {
		this.city = city;
		this.building = building;
	}

	@Override
	public String getMethodName() {
		return "onBuildingConstructed";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, building };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), building.getClass() };
	}

}
