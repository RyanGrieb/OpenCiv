package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.EngineeringTech;
import me.rhin.openciv.shared.stat.Stat;

public class Aqueduct extends Building {

	public Aqueduct(City city) {
		super(city);
		
		this.statLine.addValue(Stat.MAINTENANCE, 1);
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
	public String getDesc() {
		return "On city growth, 40% of stored\nfood carries over.";
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
