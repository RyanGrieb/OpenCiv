package me.rhin.openciv.server.game.civilization;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;

public abstract class Civ {

	protected AbstractPlayer player;

	public Civ(AbstractPlayer player) {
		this.player = player;
	}

	public abstract String getName();

	public abstract void initHeritage();

	public TileType getBiasTileType() {
		return null;
	}

	public boolean canCaptureUnit(Unit unit) {
		return false;
	}

	protected void addHeritage(Heritage heritage) {
		System.out.println("Adding: " + heritage.getName());
		player.getHeritageTree().addHeritage(heritage);
	}
}
