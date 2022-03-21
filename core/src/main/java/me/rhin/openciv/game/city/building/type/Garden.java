package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.TheologyTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Garden extends Building {

	public Garden(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FOOD_GAIN, 1);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_GARDEN;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(TheologyTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A food bonus building. Requires the city to be next to a river.", "+1 Food",
				"+10% Food Production", "+1 Maintenance");
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 120;
	}

	@Override
	public String getName() {
		return "Garden";
	}

}
