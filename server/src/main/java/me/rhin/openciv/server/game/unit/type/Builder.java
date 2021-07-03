package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Builder extends UnitItem {

	public Builder(City city) {
		super(city);
	}

	public static class BuilderUnit extends Unit {

		private boolean building;
		private String improvement;

		public BuilderUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
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

		public void setBuilding(boolean building) {
			this.building = building;
		}

		public boolean isBuilding() {
			return building;
		}

		public String getImprovement() {
			return improvement;
		}

		public void setImprovement(String improvement) {
			this.improvement = improvement;
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
}
