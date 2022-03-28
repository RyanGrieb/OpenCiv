package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class ResizeEvent implements Event {

	private int width, height;

	public ResizeEvent(int width, int height) {
		this.width = width;
		this.height = height;
	}

	@Override
	public String getMethodName() {
		return "onResize";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { width, height };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { int.class, int.class };
	}

}
