package me.rhin.openciv.game.player;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;

public class AIPlayer extends AbstractPlayer {

	public AIPlayer(String name) {
		super(name);
	}

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
