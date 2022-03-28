package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;

public class NewUnitEvent implements Event {

	private Unit unit;

	public NewUnitEvent(Unit unit) {
		this.unit = unit;
	}

	@Override
	public String getMethodName() {
		return "onNewUnit";
	}

	@Override
	public Object[] getMethodParams() {

		return new Object[] { unit };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { unit.getClass() };
	}

}
