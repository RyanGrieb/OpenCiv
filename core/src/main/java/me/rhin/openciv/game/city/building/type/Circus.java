package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.TrappingTech;
import me.rhin.openciv.shared.stat.Stat;

public class Circus extends Building {

	public Circus(City city) {
		super(city);

		this.statLine.addValue(Stat.MORALE, 10);
	}

	@Override
	public float getBuildingProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public String getName() {
		return "Circus";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().hasResearched(TrappingTech.class);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_CIRCUS;
	}

	@Override
	public String getDesc() {
		return "Provides the city +10 morale";
	}

}
