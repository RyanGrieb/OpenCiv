package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.CivilServiceTech;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Pikeman extends UnitItem {

	public Pikeman(City city) {
		super(city);
	}

	public static class PikemanUnit extends Unit {

		public PikemanUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 28);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public float getCombatStrength(AttackableEntity target) {

			float modifier = 1;

			if (target instanceof Unit) {
				Unit targetUnit = (Unit) target;

				if (targetUnit.getUnitTypes().contains(UnitType.MOUNTED)) {
					modifier = 1.5F;
				}
			}

			return combatStrength.getStatValue(Stat.COMBAT_STRENGTH) * modifier;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.MELEE);
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
			return "Pikeman";
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 90;
	}

	@Override
	public float getGoldCost() {
		return 225;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(CivilServiceTech.class);
	}

	@Override
	public String getName() {
		return "Pikeman";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.MELEE);
	}

	@Override
	public float getBaseCombatStrength() {
		return 28;
	}
	
}
