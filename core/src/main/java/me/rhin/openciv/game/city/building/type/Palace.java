package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Palace extends Building {

	public Palace(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);
		statLine.addValue(Stat.GOLD_GAIN, 3);
		statLine.addValue(Stat.SCIENCE_GAIN, 3);
		statLine.addValue(Stat.PRODUCTION_GAIN, 3);

		return statLine;
	}

	@Override
	public String getName() {
		return "Palace";
	}

	@Override
	public float getBuildingProductionCost() {
		return -1;
	}

	@Override
	public float getGoldCost() {
		return 0;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return false;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_PALACE;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("The starter building for every city.", "+1 Heritage", "+3 Gold", "+3 Science",
				"+3 Production");
	}
}
