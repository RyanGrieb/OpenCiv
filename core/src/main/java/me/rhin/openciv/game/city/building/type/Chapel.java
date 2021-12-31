package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Chapel extends Building {

	public Chapel(City city) {
		super(city);

		this.statLine.addValue(Stat.FAITH_GAIN, 1);
	}

	@Override
	public float getBuildingProductionCost() {
		return 40;
	}

	@Override
	public float getGoldCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Chapel";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(PotteryTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_CHAPEL;
	}

	@Override
	public String getDesc() {
		return "Provides the city +1 faith";
	}

	
}
