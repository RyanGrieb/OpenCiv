package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface UnitFinishedMoveListener extends Listener {

	public void onUnitFinishMove(Tile prevTile, Unit unit);

	public static class UnitFinishedMoveEvent extends Event<UnitFinishedMoveListener> {

		private Tile prevTile;
		private Unit unit;

		public UnitFinishedMoveEvent(Tile prevTile, Unit unit) {
			this.prevTile = prevTile;
			this.unit = unit;
		}

		@Override
		public void fire(ArrayList<UnitFinishedMoveListener> listeners) {
			for (UnitFinishedMoveListener listener : listeners) {
				listener.onUnitFinishMove(prevTile, unit);
			}
		}

		@Override
		public Class<UnitFinishedMoveListener> getListenerType() {
			return UnitFinishedMoveListener.class;
		}

	}
}
