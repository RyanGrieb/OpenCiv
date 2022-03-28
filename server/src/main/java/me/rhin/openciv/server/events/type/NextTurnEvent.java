package me.rhin.openciv.server.events.type;

import me.rhin.openciv.shared.listener.Event;

public class NextTurnEvent implements Event {

	@Override
	public String getMethodName() {
		return "onNextTurn";
	}

	@Override
	public Object[] getMethodParams() {
		return null;
	}

	@Override
	public Class<?>[] getMethodParamClasses() {

		return null;
	}

}
