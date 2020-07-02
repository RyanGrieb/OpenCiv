package me.rhin.openciv.shared.listener;

import java.util.Queue;

public abstract class Event<T extends Listener> {

	private boolean cancelled;

	public abstract void fire(Queue<T> listeners);

	public abstract Class<T> getListenerType();

	public void cancel() {
		cancelled = true;
	}

	public boolean isCancelled() {
		return cancelled;
	}

}
