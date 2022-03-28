package me.rhin.openciv.headless.listener.events.type;

import me.rhin.openciv.headless.demo.AppleObj;
import me.rhin.openciv.headless.listener.events.Event;

public class AppleFallEvent implements Event {

	private AppleObj appleObj;

	public AppleFallEvent(AppleObj appleObj) {
		this.appleObj = appleObj;
	}

	@Override
	public String getMethodName() {
		return "onAppleFall";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { appleObj };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { AppleObj.class };
	}

}
