package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;

public class ServerSettleCityEvent implements Event {

	private City city;

	public ServerSettleCityEvent(City city) {
		this.city = city;
	}

	@Override
	public String getMethodName() {
		return "onServerSettleCity";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass() };
	}

}
