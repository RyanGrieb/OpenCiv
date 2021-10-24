package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.shared.stat.Stat;

public class Colosseum extends Building {

	public Colosseum(City city) {
		super(city);

		this.statLine.addValue(Stat.MORALE, 10);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public float getGoldCost() {
		return 300;
	}

	@Override
	public String getName() {
		return "Colosseum";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class);
	}

}
