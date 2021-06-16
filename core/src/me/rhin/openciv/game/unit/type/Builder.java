package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class Builder extends UnitItem {

	public static class BuilderUnit extends Unit {
		public BuilderUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_BUILDER);

			this.canAttack = false;
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
			return 0;
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}
	}

	@Override
	public int getProductionCost() {
		return 50;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Builder";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_BUILDER;
	}
}
