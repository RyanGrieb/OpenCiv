package me.rhin.openciv.events.type;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;

public class SelectUnitEvent implements Event {

	private Unit unit;

	public SelectUnitEvent(Unit unit) {
		this.unit = unit;
	}

	@Override
	public String getMethodName() {
		return "onSelectUnit";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { unit };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { Unit.class };
	}

}
