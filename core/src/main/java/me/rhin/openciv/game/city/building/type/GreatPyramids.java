package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.shared.stat.Stat;

public class GreatPyramids extends Building implements Wonder {

	public GreatPyramids(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
	}

	@Override
	public String getName() {
		return "Great Pyramids";
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public void onBuilt() {
		Civilization.getInstance().getGame().getWonders().setBuilt(getClass());
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MasonryTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_PYRAMIDS;
	}

	@Override
	public String getDesc() {
		return "A great ancient wonder. \nOnce built, recieve 2 builders.\n+1 Heritage";
	}
}
