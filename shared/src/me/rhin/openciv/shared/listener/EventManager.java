package me.rhin.openciv.shared.listener;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Queue;

public class EventManager {
	private final HashMap<Class<? extends Listener>, LinkedList<? extends Listener>> listenerMap = new HashMap<>();

	// TODO: Support multiple listenerType's as input. E.g. Class<L>... listenerType
	public <L extends Listener> void addListener(Class<L> listenerType, L listener) {

		@SuppressWarnings("unchecked")
		LinkedList<L> listeners = (LinkedList<L>) listenerMap.get(listenerType);

		if (listeners == null) {
			listeners = new LinkedList<>(Arrays.asList(listener));
			listenerMap.put(listenerType, listeners);
			return;
		}

		listeners.add(listener);

	}

	public <L extends Listener, E extends Event<L>> void fireEvent(E event) {
		Class<L> listenerType = event.getListenerType();
		@SuppressWarnings("unchecked")
		Queue<L> listeners = (LinkedList<L>) listenerMap.get(listenerType);

		if (listeners == null || listeners.isEmpty()) {
			return;
		}

		// Create copy to avoid concurrent modification
		//ArrayList<L> listenersCopy = new ArrayList<>(listeners);

		event.fire(listeners);
	}

	public <L extends Listener> void removeListener(Class<L> listenerType, L listener) {
		@SuppressWarnings("unchecked")
		LinkedList<L> listeners = (LinkedList<L>) listenerMap.get(listenerType);

		if (listeners != null)
			listeners.remove(listener);

	}

	public void clearEvents() {
		listenerMap.clear();
	}

}
