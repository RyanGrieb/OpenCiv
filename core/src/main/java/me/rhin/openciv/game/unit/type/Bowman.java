package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.RangedUnit;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.game.unit.UnitParameter;

public class Bowman extends RangedUnit {

	public Bowman(UnitParameter unitParameter, TextureEnum assetEnum) {
		super(unitParameter, assetEnum);
	}

	@Override
	public float getMovementCost(Tile prevTile, Tile tile) {
		if (tile.containsTileProperty(TileProperty.WATER))
			return 1000000;
		else
			return tile.getMovementCost(prevTile);
	}

	@Override
	public int getRangedCombatStrength(AttackableEntity target) {
		return 7;
	}

	@Override
	public List<UnitType> getUnitTypes() {
		return Arrays.asList(UnitType.RANGED);
	}


	@Override
	public boolean canUpgrade() {
		return false;
	}
}
