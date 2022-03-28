package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class LeftClickEvent implements Event {

	private int x, y;

	public LeftClickEvent(int x, int y) {
		this.x = y;
		this.y = y;
	}

	@Override
	public String getMethodName() {
		return "onLeftClick";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { x, y };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { int.class, int.class };
	}

}
