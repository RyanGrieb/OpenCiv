package me.rhin.openciv.events.type;

import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.shared.listener.Event;

public class PickHeritageEvent implements Event {

	private Heritage heritage;

	public PickHeritageEvent(Heritage heritage) {
		this.heritage = heritage;
	}

	@Override
	public String getMethodName() {
		return "onPickHeritage";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { heritage };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { Heritage.class };
	}
}
