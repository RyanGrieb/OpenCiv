package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.research.type.ConstructionTech;

public class LumberMillImprovement extends TileImprovement {

	public LumberMillImprovement(TileType tileType, int maxTurns) {
		super(tileType, maxTurns);
	}

	@Override
	public Class<? extends Technology> getRequiredTech() {
		return ConstructionTech.class;
	}

	@Override
	public String getName() {
		return "lumbermill";
	}
}