package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;

public class WorkBoat extends UnitItem {

	public WorkBoat(City city) {
		super(city);
	}

	public static class WorkBoatUnit extends Unit {

		public WorkBoatUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_WORK_BOAT);
			this.canAttack = false;
		}

		@Override
		public int getMovementCost(Tile prevTile, Tile tile) {
			if (!tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public int getCombatStrength() {
			return 0;
		}
	}

	@Override
	public int getProductionCost() {
		return 30;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.isCoastal() && city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class);
	}

	@Override
	public String getName() {
		return "Work Boat";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_WORK_BOAT;
	}
}