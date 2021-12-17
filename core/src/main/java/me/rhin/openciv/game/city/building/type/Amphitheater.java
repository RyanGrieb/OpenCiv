package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.DramaPoetryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Amphitheater extends Building {

	public Amphitheater(City city) {
		super(city);
		
		this.statLine.addValue(Stat.HERITAGE_GAIN, 3);
		this.statLine.addValue(Stat.MAINTENANCE, 2);
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
	public String getDesc() {
		return "+3 Heritage in the city";
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
