package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Stonehenge extends Building implements Wonder {

	public Stonehenge(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FAITH_GAIN, 5);

		return statLine;
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_STONEHENGE;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return !Civilization.getInstance().getGame().getWonders().isBuilt(getClass())
				&& city.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class);
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("An ancient religious wonder for faith output.", "+5 Faith");
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public String getName() {
		return "Stonehenge";
	}

}