package me.rhin.openciv.server.game.map.tile.improvement;

import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.research.type.CalendarTech;

public class PlantationImprovement extends TileImprovement {

	public PlantationImprovement(TileType tileType, int maxTurns) {
		super(tileType, maxTurns);
	}

	@Override
	public Class<? extends Technology> getRequiredTech() {
		return CalendarTech.class;
	}

	@Override
	public String getName() {
		return "plantation";
	}

}
