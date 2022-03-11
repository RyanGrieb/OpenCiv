package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.server.game.research.type.MachineryTech;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.type.Crossbowman.CrossbowmanUnit;

public class CompositeBowman extends UnitItem {

	public CompositeBowman(City city) {
		super(city);
	}

	public static class CompositeBowmanUnit extends RangedUnit {

		public CompositeBowmanUnit(AbstractPlayer playerOwner, Tile standingTile) {
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
			return Arrays.asList(UnitType.RANGED);
		}

		@Override
		public Class<? extends Unit> getUpgradedUnit() {
			return CrossbowmanUnit.class;
		}

		@Override
		public boolean canUpgrade() {
			return playerOwner.getResearchTree().hasResearched(MachineryTech.class);
		}
		
		@Override
		public String getName() {
			return "Composite Bowman";
		}

		@Override
		public int getBaseRangedStrength() {
			return 12;
		}

		@Override
		public float getBaseCombatStrength() {
			return 18;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		
		//Crossbowman can be built
		if (city.getPlayerOwner().getResearchTree().hasResearched(MachineryTech.class))
			return false;
		
		return city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class);
	}

	@Override
	public String getName() {
		return "Composite Bowman";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

	@Override
	public float getBaseCombatStrength() {
		return 18;
	}

}
