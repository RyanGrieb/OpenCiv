package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;

public class CityLooseMajorityReligionEvent implements Event {

	private City city;
	private PlayerReligion oldMajority;

	public CityLooseMajorityReligionEvent(City city, PlayerReligion oldMajority) {
		this.city = city;
		this.oldMajority = oldMajority;
	}

	@Override
	public String getMethodName() {
		return "onCityLooseReligionMajority";
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
