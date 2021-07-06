package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.research.type.AnimalHusbandryTech;

public class PastureImprovement extends TileImprovement {

	public PastureImprovement(TileType tileType, int maxTurns) {
		super(tileType, maxTurns);
	}
	
	@Override
	public Class<? extends Technology> getRequiredTech() {
		return AnimalHusbandryTech.class;
	}
	
	@Override
	public String getName() {
		return "pasture";
	}
}
