package me.rhin.openciv.server.game.unit.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.unit.Unit;

public class Warrior implements ProductionItem {

	public static class WarriorUnit extends Unit {

		public WarriorUnit(Player playerOwner, Tile standingTile) {
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
		return "Warrior";
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
