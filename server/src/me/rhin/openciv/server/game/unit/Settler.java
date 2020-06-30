package me.rhin.openciv.server.game.unit;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;

public class Settler extends Unit {

	public Settler(Player playerOwner, Tile standingTile) {
		super(playerOwner, standingTile);
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (tile.getTileType().isWater())
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}

	@Override
	public String getName() {
		return "Settler";
	}

	@Override
	public int getProductionCost() {
		return 0;
	}
}
