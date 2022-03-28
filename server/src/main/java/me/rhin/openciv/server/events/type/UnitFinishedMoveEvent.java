package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.Event;

public class UnitFinishedMoveEvent implements Event {

	private Tile prevTile;
	private Unit unit;

	public UnitFinishedMoveEvent(Tile prevTile, Unit unit) {
		this.prevTile = prevTile;
		this.unit = unit;
	}

	@Override
	public String getMethodName() {
		return "onUnitFinishMove";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { prevTile, unit };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { prevTile.getClass(), Unit.class };
	}

}
