package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.PotteryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Granary extends Building {

	public Granary(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 2);
		this.statLine.addValue(Stat.MAINTENANCE, -1);
	}

	@Override
	public float getBuildingProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(PotteryTech.class);
	}

	@Override
	public String getName() {
		return "Granary";
	}
}
