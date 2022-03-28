package me.rhin.openciv.headless.listener.events;

import java.util.List;

public interface Event {

	public String getMethodName();

	public Object[] getMethodParams();

	public Class<?>[] getMethodParamClasses();

}
