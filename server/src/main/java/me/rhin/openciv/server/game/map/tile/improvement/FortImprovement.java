package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;

public class FortImprovement extends TileImprovement {

	public FortImprovement() {
		super(TileType.FORT, 7);
	}

	@Override
	public String getName() {
		return "fort";
	}
}
