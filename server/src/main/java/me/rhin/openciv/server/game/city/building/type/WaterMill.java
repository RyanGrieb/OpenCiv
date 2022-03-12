package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.WheelTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class WaterMill extends Building {

	public WaterMill(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FOOD_GAIN, 2);
		statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		statLine.addValue(Stat.MAINTENANCE, 2);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getOriginTile().isAdjToRiver()
				&& city.getPlayerOwner().getResearchTree().hasResearched(WheelTech.class);
	}

	@Override
	public String getName() {
		return "Water Mill";
	}
}
