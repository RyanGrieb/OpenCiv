package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.util.ClickType;

public class RightClickEvent implements Event {

	private ClickType clickType;
	private int x, y;

	public RightClickEvent(ClickType clickType, int x, int y) {
		this.clickType = clickType;
		this.x = x;
		this.y = y;
	}

	@Override
	public String getMethodName() {
		return "onRightClick";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { clickType, x, y };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { clickType.getClass(), int.class, int.class };
	}

}
