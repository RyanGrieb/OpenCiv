package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.unit.Unit;

public class Scout implements ProductionItem {

	public static class ScoutUnit extends Unit {

		public ScoutUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);
		}

		@Override
		public int getMovementCost(Tile tile) {
			if (tile.getTileType().hasProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getTileType().getMovementCost();
		}
	}

	@Override
	public String getName() {
		return "Scout";
	}

	@Override
	public int getProductionCost() {
		return 0;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}
}
