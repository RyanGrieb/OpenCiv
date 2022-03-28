package me.rhin.openciv.shared.listener;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;

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
					// System.out.println("No method in -" + listener + ": " + method);
					continue;
				}
				if (method.isAnnotationPresent(EventHandler.class)) {
					MethodWrapper methodWrapper = new MethodWrapper(method, event, listener);
					methods.add(methodWrapper);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}

		Collections.sort(methods);

		for (MethodWrapper method : methods) {
			try {
				method.invoke();
			} catch (Exception e) {
				System.out.println("Invoke err: " + method.getMethod().getName());
				e.printStackTrace();
			}
		}

	}

	public void removeListener(Listener listener) {
		listeners.remove(listener);
	}

	public void clearListeners() {
		listeners.clear();
	}

	public void verifyListener(Listener listener) {
		System.out.println(listeners.contains(listener));
	}

}
