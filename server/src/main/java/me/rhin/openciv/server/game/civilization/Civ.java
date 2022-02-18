package me.rhin.openciv.server.game.civilization;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;

public abstract class Civ {

	private static final Logger LOGGER = LoggerFactory.getLogger(Civ.class);

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
		LOGGER.info("Adding: " + heritage.getName());
		player.getHeritageTree().addHeritage(heritage);
	}
}
