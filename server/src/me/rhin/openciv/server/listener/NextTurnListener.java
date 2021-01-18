package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface NextTurnListener extends Listener {

	public void onNextTurn();

	public static class NextTurnEvent extends Event<NextTurnListener> {

		public NextTurnEvent() {
		}

		@Override
		public void fire(ArrayList<NextTurnListener> listeners) {
			for (NextTurnListener listener : listeners) {
				listener.onNextTurn();
			}
		}

		@Override
		public Class<NextTurnListener> getListenerType() {
			return NextTurnListener.class;
		}

	}
}
