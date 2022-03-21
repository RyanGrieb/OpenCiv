package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.PhilosophyTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class NationalCollege extends Building {

	public NationalCollege(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.SCIENCE_GAIN, 3);
		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
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
	public List<String> getDesc() {
		return Arrays.asList(
				"An essential building to keep up with science as the game progresses. Requires a library in all cities.",
				"+3 Science", "+1 Heritage", "+50% Science Production");
	}

}
