package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.listener.Event;

public class CaptureCityEvent implements Event {

	private City city;
	private AbstractPlayer oldPlayer;

	public CaptureCityEvent(City city, AbstractPlayer oldPlayer) {
		this.city = city;
		this.oldPlayer = oldPlayer;
	}

	@Override
	public String getMethodName() {
		return "onCaptureCity";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { city, oldPlayer };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { city.getClass(), oldPlayer.getClass() };
	}

}
