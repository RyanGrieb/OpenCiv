package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;

public class MouseHoveredEvent implements Event {

	private float mouseX, mouseY;

	public MouseHoveredEvent(float mouseX, float mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;
	}

	@Override
	public String getMethodName() {
		return "onMouseHovered";
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
