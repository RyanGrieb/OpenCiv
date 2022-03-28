package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class ScrollEvent implements Event {

	private float mouseX, mouseY;

	public ScrollEvent(float mouseX, float mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;
	}

	@Override
	public String getMethodName() {
		return "onScroll";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { mouseX, mouseY };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { float.class, float.class };
	}

}
