package me.rhin.openciv.events.type;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;

public class LeftClickEnemyUnitEvent implements Event {

	private Unit unit;

	public LeftClickEnemyUnitEvent(Unit unit) {
		this.unit = unit;
	}

	@Override
	public String getMethodName() {
		return "onLeftClickEnemyUnit";
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
