package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;

public class FarmOceanImprovement extends TileImprovement {

	public FarmOceanImprovement(TileType tileType) {
		super(tileType, 0);
	}

	@Override
	public String getName() {
		return "farm_ocean";
	}
}
