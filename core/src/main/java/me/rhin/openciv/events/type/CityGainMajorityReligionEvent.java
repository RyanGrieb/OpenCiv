package me.rhin.openciv.events.type;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;

public class CityGainMajorityReligionEvent implements Event {

	private City city;
	private PlayerReligion oldMajority;

	public CityGainMajorityReligionEvent(City city, PlayerReligion oldMajority) {
		this.city = city;
		this.oldMajority = oldMajority;
	}

	@Override
	public String getMethodName() {
		return "onCityGainMajorityReligion";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, oldMajority };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), oldMajority.getClass() };
	}

}
