package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.WheelTech;
import me.rhin.openciv.shared.stat.Stat;

public class WaterMill extends Building {

	public WaterMill(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 2);
		this.statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		//TODO: Implement maintenance
	}

	@Override
	public int getProductionCost() {
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
