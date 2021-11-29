package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.TrappingTech;
import me.rhin.openciv.shared.stat.Stat;

public class Circus extends Building {

	public Circus(City city) {
		super(city);

		this.statLine.addValue(Stat.MORALE_CITY, 10);
	}

	@Override
	public float getBuildingProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public String getName() {
		return "Circus";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(TrappingTech.class);
	}

}
