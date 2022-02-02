package me.rhin.openciv.server.game.unit.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.research.type.MachineryTech;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.DeleteUnitOptions;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.stat.Stat;

public class Builder extends UnitItem {

	public Builder(City city) {
		super(city);
	}

	public static class BuilderUnit extends Unit {

		private boolean building;
		private TileImprovement improvement;

		public BuilderUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		}

		@Override
		public void onNextTurn() {
			super.onNextTurn();
			// Update all the worked tiles
			if (building) {
				getStandingTile().workTile(this, improvement);
				if (getStandingTile().getTileImprovement() == null
						|| getStandingTile().getTileImprovement().isFinished()) {
					building = false;
					improvement = null;
				}
			}

		}

		@Override
		public void moveToTargetTile() {
			super.moveToTargetTile();
			building = false;
			improvement = null;
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
		protected void onKill(ArrayList<DeleteUnitOptions> optionList) {
			super.onKill(optionList);

			building = false;
			improvement = null;
		}

		public void setBuilding(boolean building) {
			this.building = building;
		}

		public boolean isBuilding() {
			return building;
		}

		public TileImprovement getImprovement() {
			return improvement;
		}

		public void setImprovement(String improvement) {
			this.improvement = standingTile.getBaseTileType().getImprovement(improvement);
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
			return "Builder";
		}

		/**
		 * Returns the improvement the builder can work on.
		 * 
		 * @param tile
		 * @return
		 */
		public TileImprovement getImprovementFromTile(Tile tile) {

			TileImprovement targetImprovement = null;

			if (tile.getBaseTileType().getImprovements() != null)
				for (TileImprovement improvement : tile.getBaseTileType().getImprovements()) {

					if (!playerOwner.getResearchTree().hasResearched(improvement.getRequiredTech())
							|| tile.containsTileProperty(TileProperty.WATER) || tile.getTileImprovement() != null)
						continue;

					targetImprovement = improvement;

				}

			return targetImprovement;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 50;
	}

	@Override
	public float getGoldCost() {
		return 175;
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
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

	@Override
	public float getBaseCombatStrength() {
		return 0;
	}
}
