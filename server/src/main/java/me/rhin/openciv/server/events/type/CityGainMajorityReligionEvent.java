package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;

public class CityGainMajorityReligionEvent implements Event {

	private City city;
	private PlayerReligion newMajority;

	public CityGainMajorityReligionEvent(City city, PlayerReligion newMajority) {
		this.city = city;
		this.newMajority = newMajority;
	}

	@Override
	public String getMethodName() {
		return "onCityGainReligionMajority";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, newMajority };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), newMajority.getClass() };
	}

}
