package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;

public class Galley implements ProductionItem {

	public static class GalleyUnit extends Unit {
		public GalleyUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_SETTLER);
			this.canAttack = true;
		}

		@Override
		public int getMovementCost(Tile tile) {
			if (!tile.getTileType().hasProperty(TileProperty.WATER))
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
		return false;
	}

	@Override
	public String getName() {
		return "Galley";
	}
}
