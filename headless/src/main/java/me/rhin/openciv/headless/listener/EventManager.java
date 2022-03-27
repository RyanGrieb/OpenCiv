package me.rhin.openciv.headless.listener;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;

import me.rhin.openciv.headless.demo.GroundObj;
import me.rhin.openciv.headless.listener.events.Event;

public class EventManager {

	private ArrayList<Listener> listeners;

	public EventManager() {
		listeners = new ArrayList<>();
	}

	public void addListener(Listener listener) {
		listeners.add(listener);
	}

	public void fireEvent(Event event) {
		callListeners(event);
	}

	private void callListeners(Event event) {

		ArrayList<MethodWrapper> methods = new ArrayList<>();

		try {
			for (Listener listener : listeners) {
				Method method = null;
				try {
					method = listener.getClass().getMethod(event.getMethodName(), event.getMethodParamClasses());
				} catch (NoSuchMethodException noMethodException) {
					continue;
				}
				if (method.isAnnotationPresent(EventHandler.class)) {
					MethodWrapper methodWrapper = new MethodWrapper(method, event, listener);
					// method.invoke(listener, event.getMethodParams());
					methods.add(methodWrapper);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}

		Collections.sort(methods);

		for (MethodWrapper method : methods) {
			method.invoke();
		}
	}

	public void removeListener(Listener listener) {
		listeners.remove(listener);
	}

}
