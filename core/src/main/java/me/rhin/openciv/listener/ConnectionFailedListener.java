package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ConnectionFailedListener extends Listener {

	public void onConnectionFailed();

	public static class ConnectionFailedEvent extends Event<ConnectionFailedListener> {

		@Override
		public void fire(ArrayList<ConnectionFailedListener> listeners) {
			for (ConnectionFailedListener listener : listeners) {
				listener.onConnectionFailed();
			}
		}

		@Override
		public Class<ConnectionFailedListener> getListenerType() {
			return ConnectionFailedListener.class;
		}
	}

}
