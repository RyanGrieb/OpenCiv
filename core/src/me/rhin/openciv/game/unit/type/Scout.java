package me.rhin.openciv.game.unit.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.Unit;

public class Scout extends Unit {

	public Scout(Player playerOwner, Tile standingTile) {
		super(playerOwner, standingTile, TextureEnum.UNIT_SCOUT);
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (tile.getTileType().isWater())
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}
}
