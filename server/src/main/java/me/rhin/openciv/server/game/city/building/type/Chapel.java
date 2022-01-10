package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.PotteryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Chapel extends Building {

	public Chapel(City city) {
		super(city);

		this.statLine.addValue(Stat.FAITH_GAIN, 50);
	}

	@Override
	public float getBuildingProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Chapel";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(PotteryTech.class);
	}

}
