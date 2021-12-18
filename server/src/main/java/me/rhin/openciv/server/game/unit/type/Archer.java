package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.ArcheryTech;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.type.CompositeBowman.CompositeBowmanUnit;
import me.rhin.openciv.shared.stat.Stat;

public class Archer extends UnitItem {

	public Archer(City city) {
		super(city);
	}

	public static class ArcherUnit extends RangedUnit {

		public ArcherUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 14);
			rangedCombatStrength.setValue(Stat.COMBAT_STRENGTH, 7);
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
			return CompositeBowmanUnit.class;
		}

		@Override
		public String getName() {
			return "Archer";
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}

	@Override
	public boolean meetsProductionRequirements() {
		
		//Composite bowman can be built
		if (city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class))
			return false;
		
		return city.getPlayerOwner().getResearchTree().hasResearched(ArcheryTech.class);
	}

	@Override
	public String getName() {
		return "Archer";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

	@Override
	public float getBaseCombatStrength() {
		return 14;
	}
}