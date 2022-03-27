package me.rhin.openciv.shared.listener;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class MethodWrapper implements Comparable<MethodWrapper> {

	private Method method;
	private Event event;
	private Listener listener;

	public MethodWrapper(Method method, Event event, Listener listener) {
		this.method = method;
		this.event = event;
		this.listener = listener;
	}

	@Override
	public int compareTo(MethodWrapper otherMethod) {
		return otherMethod.getMethod().getAnnotation(EventHandler.class).priority().ordinal()
				- method.getAnnotation(EventHandler.class).priority().ordinal();
	}

	public Method getMethod() {

		return method;
	}

	public void invoke() throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		method.invoke(listener, event.getMethodParams());
	}

}
