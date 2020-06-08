package me.rhin.openciv.game.unit;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;

public class Warrior extends Unit {

	public Warrior(Tile standingTile) {
		super(standingTile, TextureEnum.UNIT_WARRIOR);
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (tile.getTileType().isWater())
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}

	//TODO: method that returns it's UI or buttons?
}
