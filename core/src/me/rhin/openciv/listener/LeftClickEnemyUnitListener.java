package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface LeftClickEnemyUnitListener extends Listener {

	public void onLeftClickEnemyUnit(Unit unit);

	public static class LeftClickEnemyUnitEvent extends Event<LeftClickEnemyUnitListener> {

		private Unit unit;

		public LeftClickEnemyUnitEvent(Unit unit) {
			this.unit = unit;
		}

		@Override
		public void fire(ArrayList<LeftClickEnemyUnitListener> listeners) {
			for (LeftClickEnemyUnitListener listener : listeners) {
				listener.onLeftClickEnemyUnit(unit);
			}
		}

		@Override
		public Class<LeftClickEnemyUnitListener> getListenerType() {
			return LeftClickEnemyUnitListener.class;
		}

	}

}
