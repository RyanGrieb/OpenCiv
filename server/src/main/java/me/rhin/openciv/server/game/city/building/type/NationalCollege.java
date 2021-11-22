package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.PhilosophyTech;
import me.rhin.openciv.shared.stat.Stat;

public class NationalCollege extends Building {

	public NationalCollege(City city) {
		super(city);

		this.statLine.addValue(Stat.SCIENCE_GAIN, 3);
		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
	}

	@Override
	public void create() {
		super.create();
		
		city.getStatLine().addModifier(Stat.SCIENCE_GAIN, 0.5F);
	}

	@Override
	public float getBuildingProductionCost() {
		return 135;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		boolean allLibraries = true;
		for (City city : city.getPlayerOwner().getOwnedCities())
			if (!city.containsBuilding(Library.class))
				allLibraries = false;
		return city.getPlayerOwner().getResearchTree().hasResearched(PhilosophyTech.class) && allLibraries;
	}

	@Override
	public String getName() {
		return "National College";
	}
}
