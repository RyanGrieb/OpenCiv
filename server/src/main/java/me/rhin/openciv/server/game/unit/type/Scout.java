package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitItemType;

public class Scout extends UnitItem {

	public Scout(City city) {
		super(city);
	}

	public static class ScoutUnit extends Unit {

		public ScoutUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else if (tile.getMovementCost(prevTile) > 1 && tile.getMovementCost(prevTile) < 3)
				return 1;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public float getMaxMovement() {
			return 3;
		}

		@Override
		public int getCombatStrength() {
			return 10;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 25;
	}
	
	@Override
	public float getGoldCost() {
		return 100;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
	
	@Override
	public String getName() {
		return "Scout";
	}
	
	@Override
	protected UnitItemType getUnitItemType() {
		return UnitItemType.MELEE;
	}
}
