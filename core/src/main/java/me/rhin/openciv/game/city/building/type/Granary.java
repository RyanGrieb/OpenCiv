package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Granary extends Building {

	public Granary(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FOOD_GAIN, 2);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public String getName() {
		return "Granary";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(PotteryTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_GRANARY;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Basic growth-enhancing building of the Ancient Era.", "+2 Food", "+1 Maintenance");
	}
}
