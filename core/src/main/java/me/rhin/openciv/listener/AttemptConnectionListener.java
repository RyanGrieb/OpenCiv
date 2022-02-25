package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface AttemptConnectionListener extends Listener {

	public void onAttemptedConnection();

	public static class AttemptConnectionEvent extends Event<AttemptConnectionListener> {

		@Override
		public void fire(ArrayList<AttemptConnectionListener> listeners) {
			for (AttemptConnectionListener listener : listeners) {
				listener.onAttemptedConnection();
			}
		}

		@Override
		public Class<AttemptConnectionListener> getListenerType() {
			return AttemptConnectionListener.class;
		}
	}

}
