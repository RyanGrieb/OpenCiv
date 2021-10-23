package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.research.type.MasonryTech;

public class QuarryImprovement extends TileImprovement {

	public QuarryImprovement(TileType tileType, int maxTurns) {
		super(tileType, maxTurns);
	}

	@Override
	public Class<? extends Technology> getRequiredTech() {
		return MasonryTech.class;
	}

	@Override
	public String getName() {
		return "quarry";
	}

}
