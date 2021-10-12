package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.map.tile.TileType;

public class Barbarians extends Civ {

	public Barbarians(AbstractPlayer player) {
		super(player);
	}

	@Override
	public String getName() {
		return "Barbarians";
	}

	@Override
	public TileType getBiasTileType() {
		return null;
	}

	@Override
	public void initHeritage() {
	}

}
