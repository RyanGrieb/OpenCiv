package me.rhin.openciv.server.game.unit;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;

public class Galley extends Unit {

	public Galley(Player playerOwner, Tile standingTile) {
		super(playerOwner, standingTile);
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (!tile.getTileType().hasProperty(TileProperty.WATER))
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}

	@Override
	public String getName() {
		return "Galley";
	}

	@Override
	public int getProductionCost() {
		return 0;
	}
}
