package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;

public class CityGrowthEvent implements Event {

	private City city;
	private int amount;
	private float foodSurplus;

	public CityGrowthEvent(City city, int amount, float foodSurplus) {
		this.city = city;
		this.amount = amount;
		this.foodSurplus = foodSurplus;
	}

	@Override
	public String getMethodName() {
		return "onCityGrowth";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, amount, foodSurplus };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), int.class, float.class };
	}

}
