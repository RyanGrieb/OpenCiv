package me.rhin.openciv.server.events.type;

import me.rhin.openciv.shared.listener.Event;

public class PlayerSpawnsSetEvent implements Event {

	@Override
	public String getMethodName() {
		return "onPlayerSpawnsSet";
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
