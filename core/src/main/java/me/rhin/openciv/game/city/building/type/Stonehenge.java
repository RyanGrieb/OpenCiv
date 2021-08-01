package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;

public class Stonehenge extends Building implements Wonder {

	public Stonehenge(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 6);
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
	public String getDesc() {
		return "An ancient relegious wonder. \n+6 Heritage";
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public void onBuilt() {
		super.onBuilt();
		
		Civilization.getInstance().getGame().getWonders().setBuilt(getClass());
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