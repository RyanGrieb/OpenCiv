package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Missionary extends UnitItem {

	public Missionary(City city) {
		super(city);
	}

	public static class MissionaryUnit extends Unit {

		public MissionaryUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable(AbstractPlayer attackingEntity) {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
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
			return "Missionary";
		}
	}

	@Override
	public float getFaithCost() {
		return 200;
	}

	@Override
	public float getUnitProductionCost() {
		return -1;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		// TODO: Support buying prophets from religions you didn't create.
		// return city.getPlayerOwner().getReligion().getPickedBonuses().size() > 1
		// &&
		// city.getCityReligion().getMajorityReligion().equals(city.getPlayerOwner().getReligion());

		return city.getPlayerOwner().getReligion().getPickedBonuses().size() > 1
				&& city.getCityReligion().getFollowersOfReligion(city.getPlayerOwner().getReligion()) > 0;
	}

	@Override
	public String getName() {
		return "Missionary";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

	@Override
	public float getBaseCombatStrength() {
		return 0;
	}

}
