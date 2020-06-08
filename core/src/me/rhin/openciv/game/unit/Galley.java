package me.rhin.openciv.game.unit;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;

public class Galley extends Unit {

	public Galley(Tile standingTile) {
		super(standingTile, TextureEnum.UNIT_SETTLER);
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (!tile.getTileType().isWater())
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}
}
