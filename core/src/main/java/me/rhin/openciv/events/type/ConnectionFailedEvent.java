package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class ConnectionFailedEvent implements Event {

	@Override
	public String getMethodName() {
		return "onConnectionFailed";
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
