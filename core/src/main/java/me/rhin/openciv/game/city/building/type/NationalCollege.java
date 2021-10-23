package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.PhilosophyTech;
import me.rhin.openciv.shared.stat.Stat;

public class NationalCollege extends Building {

	public NationalCollege(City city) {
		super(city);

		this.statLine.addValue(Stat.SCIENCE_GAIN, 3);
		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
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
	public String getName() {
		return "National College";
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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_NATIONAL_COLLEGE;
	}

	@Override
	public String getDesc() {
		return "Requires a library in all cities.\n\n+3 Science\n50% Science in this city";
	}

}
