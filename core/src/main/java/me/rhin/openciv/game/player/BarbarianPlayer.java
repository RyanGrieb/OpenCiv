package me.rhin.openciv.game.player;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;

public class BarbarianPlayer extends AbstractPlayer {

	public BarbarianPlayer() {
		super("Barbarians");
	}

	// NOTE: These are dummy methods used only by Players
	// FIXME: Find a alternative to this
	@Override
	public Tile getHoveredTile() {
		return null;
	}

	@Override
	public void setRightMouseHeld(boolean b) {
	}

	@Override
	public boolean isRightMouseHeld() {
		return false;
	}

	@Override
	public void unselectUnit() {
	}

	@Override
	public Unit getSelectedUnit() {
		return null;
	}

}
