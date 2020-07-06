package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface TurnTimeUpdateListener extends Listener {

	public void onTurnTimeUpdate(int turnTime);

	public static class TurnTimeUpdateEvent extends Event<TurnTimeUpdateListener> {

		private int turnTime;

		public TurnTimeUpdateEvent(int turnTime) {
			this.turnTime = turnTime;
		}

		@Override
		public void fire(ArrayList<TurnTimeUpdateListener> listeners) {
			for (TurnTimeUpdateListener listener : listeners) {
				listener.onTurnTimeUpdate(turnTime);
			}
		}

		@Override
		public Class<TurnTimeUpdateListener> getListenerType() {
			return TurnTimeUpdateListener.class;
		}

	}
}
