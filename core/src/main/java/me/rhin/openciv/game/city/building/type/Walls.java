package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Walls extends Building {

	public Walls(City city) {
		super(city);
		
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_WALL;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MasonryTech.class);
	}

	@Override
	public String getDesc() {
		return "Basic ancient defensive building. \n+5 City combat strength \n+50 City health";
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public String getName() {
		return "Walls";
	}

}
