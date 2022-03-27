package me.rhin.openciv.events.type;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;

public class UnitActEvent implements Event {

	private Unit unit;

	public UnitActEvent(Unit unit) {
		this.unit = unit;
	}

	@Override
	public String getMethodName() {
		return "onUnitAct";
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
