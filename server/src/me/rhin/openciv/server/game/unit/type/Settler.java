package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Settler extends UnitItem {

	public Settler(City city) {
		super(city);
	}

	public static class SettlerUnit extends Unit {

		public SettlerUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
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
	}

	@Override
	public int getProductionCost() {
		return 80;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
	
	@Override
	public String getName() {
		return "Settler";
	}
}
