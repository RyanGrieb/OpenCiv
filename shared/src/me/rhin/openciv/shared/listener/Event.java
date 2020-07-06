package me.rhin.openciv.shared.listener;

import java.util.ArrayList;

public abstract class Event<T extends Listener> {

	private boolean cancelled;

	public abstract void fire(ArrayList<T> listeners);

	public abstract Class<T> getListenerType();

	public void cancel() {
		cancelled = true;
	}

	public boolean isCancelled() {
		return cancelled;
	}

}
