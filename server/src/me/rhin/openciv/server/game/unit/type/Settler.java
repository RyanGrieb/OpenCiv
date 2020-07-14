package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Settler extends UnitItem {

	public static class SettlerUnit extends Unit {

		public SettlerUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public int getMovementCost(Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost();
		}
	}

	@Override
	public int getProductionCost() {
		return 106;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
}
