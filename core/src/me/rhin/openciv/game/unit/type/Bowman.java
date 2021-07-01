package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.UnitParameter;

public class Bowman extends RangedUnit {

	public Bowman(UnitParameter unitParameter, TextureEnum assetEnum) {
		super(unitParameter, assetEnum);
	}

	@Override
	public int getMovementCost(Tile prevTile, Tile tile) {
		if (tile.containsTileProperty(TileProperty.WATER))
			return 1000000;
		else
			return tile.getMovementCost(prevTile);
	}

	@Override
	public int getCombatStrength() {
		return 14;
	}

	@Override
	public int getRangedCombatStrength() {
		return 7;
	}

}
