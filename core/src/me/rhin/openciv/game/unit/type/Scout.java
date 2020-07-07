package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Scout extends UnitItem {

	public static class ScoutUnit extends Unit {
		public ScoutUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_SCOUT);
			this.canAttack = true;
		}

		@Override
		public int getMovementCost(Tile tile) {
			if (tile.getTileType().hasProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getTileType().getMovementCost();
		}

	}

	@Override
	public int getProductionCost() {
		return 0;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Scout";
	}
}
