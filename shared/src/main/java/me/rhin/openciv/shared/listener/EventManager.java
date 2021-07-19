package me.rhin.openciv.shared.listener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

public class EventManager {

	private final HashMap<Class<? extends Listener>, ArrayList<? extends Listener>> listenerMap = new HashMap<>();

	// TODO: Support multiple listenerType's as input. E.g. Class<L>... listenerType
	public <L extends Listener> void addListener(Class<L> listenerType, L listener) {

		@SuppressWarnings("unchecked")
		ArrayList<L> listeners = (ArrayList<L>) listenerMap.get(listenerType);

		if (listeners == null) {
			listeners = new ArrayList<>(Arrays.asList(listener));
			listenerMap.put(listenerType, listeners);
			return;
		}

		listeners.add(listener);

	}

	public <L extends Listener, E extends Event<L>> void fireEvent(E event) {
		Class<L> listenerType = event.getListenerType();

		@SuppressWarnings("unchecked")
		ArrayList<L> listeners = (ArrayList<L>) listenerMap.get(listenerType);

		if (listeners == null || listeners.isEmpty())
			return;

		// FIXME: This is inefficient
		ArrayList<L> listenersCopy = new ArrayList<>(listeners);

		event.fire(listenersCopy);
	}

	public <L extends Listener> void removeListener(Class<L> listenerType, L listener) {
		@SuppressWarnings("unchecked")
		ArrayList<L> listeners = (ArrayList<L>) listenerMap.get(listenerType);

		if (listeners != null)
			listeners.remove(listener);

	}

	public void clearEvents() {
		listenerMap.clear();
	}

	@SuppressWarnings("unchecked")
	public <L extends Listener> void clearListenersFromObject(L listener) {
		try {
			// Go through all the listeners
			for (Class<? extends Listener> listenerType : ((HashMap<Class<? extends Listener>, ArrayList<? extends Listener>>) listenerMap
					.clone()).keySet()) {
				ArrayList<L> listeners = (ArrayList<L>) listenerMap.get(listenerType);

				// Remove object attached all listeners
				if (listeners != null)
					listeners.remove(listener);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}