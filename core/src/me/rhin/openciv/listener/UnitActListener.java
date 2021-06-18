package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface UnitActListener extends Listener {

	public void onUnitAct(Unit unit);

	public static class UnitActEvent extends Event<UnitActListener> {

		private Unit unit;

		public UnitActEvent(Unit unit) {
			this.unit = unit;
		}

		@Override
		public void fire(ArrayList<UnitActListener> listeners) {
			for (UnitActListener listener : listeners) {
				listener.onUnitAct(unit);
			}
		}

		@Override
		public Class<UnitActListener> getListenerType() {
			return UnitActListener.class;
		}
	}
}
