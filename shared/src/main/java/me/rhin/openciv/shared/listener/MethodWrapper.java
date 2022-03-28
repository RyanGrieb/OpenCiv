package me.rhin.openciv.shared.listener;

import java.lang.reflect.InvocationTargetException;

import com.badlogic.gdx.utils.reflect.Method;
import com.badlogic.gdx.utils.reflect.ReflectionException;

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
		// FIXME: LibGDX GWT doesn't support the lines below. We don't use event
		// priority anyway.

		// return
		// otherMethod.getMethod().getAnnotation(EventHandler.class).priority().ordinal()
		// - method.getAnnotation(EventHandler.class).priority().ordinal();
		return 0;
	}

	public Method getMethod() {

		return method;
	}

	public void invoke() throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		try {
			method.invoke(listener, event.getMethodParams());
		} catch (ReflectionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

}
