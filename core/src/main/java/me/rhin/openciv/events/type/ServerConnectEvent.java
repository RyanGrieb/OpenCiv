package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class ServerConnectEvent implements Event {

	@Override
	public String getMethodName() {
		return "onServerConnect";
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
