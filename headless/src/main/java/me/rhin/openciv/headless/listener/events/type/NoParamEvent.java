package me.rhin.openciv.headless.listener.events.type;

import me.rhin.openciv.headless.listener.events.Event;

public class NoParamEvent implements Event {

	@Override
	public String getMethodName() {
		return "noParamMethod";
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
