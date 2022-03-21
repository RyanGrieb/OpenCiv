package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.EngineeringTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Aqueduct extends Building {

	public Aqueduct(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_AQUEDUCT;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(EngineeringTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Classical Era growth-enhancing building. 40% of food stored in the city is carried over after a new citizen is born.",
				"+1 Maintenance");
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Aqueduct";
	}

}
