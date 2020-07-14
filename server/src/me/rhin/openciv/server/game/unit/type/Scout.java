package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;

public class Scout extends UnitItem {

	public static class ScoutUnit extends Unit {

		public ScoutUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public int getMovementCost(Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else if (tile.getMovementCost() > 1 && tile.getMovementCost() < 3)
				return 1;
			else
				return tile.getMovementCost();
		}

		@Override
		public int getMaxMovement() {
			return 4;
		}
	}

	@Override
	public int getProductionCost() {
		return 25;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
}
