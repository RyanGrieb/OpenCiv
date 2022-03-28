package me.rhin.openciv.server.events.type;

import me.rhin.openciv.shared.listener.Event;

public class StartGameRequestEvent implements Event {

	@Override
	public String getMethodName() {
		return "onStartGameRequest";
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
