package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.DramaPoetryTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Amphitheater extends Building {

	public Amphitheater(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 3);
		statLine.addValue(Stat.MAINTENANCE, 2);

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_AMPHITHEATER;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(DramaPoetryTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Classical Era culture building. Requires Monument or Stele.", "+3 Heritage in the city", "+2 Maintenance");
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Amphitheater";
	}
}
