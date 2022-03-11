package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface NewUnitListener extends Listener {

	public void onNewUnit(Unit unit);

	public static class NewUnitEvent extends Event<NewUnitListener> {

		private Unit unit;

		public NewUnitEvent(Unit unit) {
			this.unit = unit;
		}

		@Override
		public void fire(ArrayList<NewUnitListener> listeners) {
			for (NewUnitListener listener : listeners) {
				listener.onNewUnit(unit);
			}
		}

		@Override
		public Class<NewUnitListener> getListenerType() {
			return NewUnitListener.class;
		}

	}

}
