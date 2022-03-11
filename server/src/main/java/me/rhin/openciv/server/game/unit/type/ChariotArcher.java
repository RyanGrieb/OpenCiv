package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.WheelTech;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class ChariotArcher extends UnitItem {

	public ChariotArcher(City city) {
		super(city);
	}

	public static class ChariotArcherUnit extends RangedUnit {

		public ChariotArcherUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.RANGED, UnitType.MOUNTED);
		}

		@Override
		public Class<? extends Unit> getUpgradedUnit() {
			return null;
		}

		@Override
		public boolean canUpgrade() {
			return false;
		}

		@Override
		public String getName() {
			return "Chariot Archer";
		}

		@Override
		public int getBaseRangedStrength() {
			return 10;
		}

		@Override
		public float getBaseCombatStrength() {
			return 17;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 56;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(WheelTech.class);
	}

	@Override
	public String getName() {
		return "Chariot Archer";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED, UnitType.MOUNTED);
	}

	@Override
	public float getBaseCombatStrength() {
		return 10;
	}
}
