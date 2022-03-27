package me.rhin.openciv.shared.listener;

import java.util.List;

public interface Event {

	public String getMethodName();

	public Object[] getMethodParams();

	public Class<?>[] getMethodParamClasses();

}
