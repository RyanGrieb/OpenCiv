package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class SetScreenEvent implements Event {

	private ScreenEnum prevScreenEnum, screenEnum;

	public SetScreenEvent(ScreenEnum prevScreenEnum, ScreenEnum screenEnum) {
		this.prevScreenEnum = prevScreenEnum;
		this.screenEnum = screenEnum;
	}

	@Override
	public String getMethodName() {
		return "onSetScreen";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { prevScreenEnum, screenEnum };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { prevScreenEnum.getClass(), screenEnum.getClass() };
	}

}
