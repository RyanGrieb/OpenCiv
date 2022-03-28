package me.rhin.openciv.headless.listener;

import java.lang.reflect.Method;

import me.rhin.openciv.headless.listener.events.Event;

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
		System.out.println(method.getName() + ":" + method.getAnnotation(EventHandler.class).priority().ordinal() + ", "
				+ otherMethod.getMethod().getName() + ":"
				+ otherMethod.getMethod().getAnnotation(EventHandler.class).priority().ordinal());

		return otherMethod.getMethod().getAnnotation(EventHandler.class).priority().ordinal()
				- method.getAnnotation(EventHandler.class).priority().ordinal();
	}

	public Method getMethod() {

		return method;
	}

	public void invoke() {
		try {
			method.invoke(listener, event.getMethodParams());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
