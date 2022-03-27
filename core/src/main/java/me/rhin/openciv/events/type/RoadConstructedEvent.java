package me.rhin.openciv.events.type;

import me.rhin.openciv.game.map.road.Road;
import me.rhin.openciv.shared.listener.Event;

public class RoadConstructedEvent implements Event {

	private Road road;

	public RoadConstructedEvent(Road road) {
		this.road = road;
	}

	@Override
	public String getMethodName() {
		return "onRoadConstructed";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { road };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { road.getClass() };
	}

}
