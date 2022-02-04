package me.rhin.openciv.server.game.civilization;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;

public abstract class Civ {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

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
