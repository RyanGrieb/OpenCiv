package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.MathematicsTech;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Catapult extends UnitItem {

	public Catapult(City city) {
		super(city);
	}

	public static class CatapultUnit extends RangedUnit {

		public CatapultUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 7);
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
		public float getRangedCombatStrength(AttackableEntity target) {
			float modifer = 1;

			if (target instanceof City) {
				modifer = 1.75F;
			}
			return rangedCombatStrength.getStatValue(Stat.COMBAT_STRENGTH) * modifer;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.RANGED);
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
			return "Catapult";
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MathematicsTech.class);
	}

	@Override
	public String getName() {
		return "Catapult";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.RANGED);
	}

	@Override
	public float getBaseCombatStrength() {
		return 7;
	}
}