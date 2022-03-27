package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class AttemptConnectionEvent implements Event {

	@Override
	public String getMethodName() {
		return "onAttemptConnection";
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
