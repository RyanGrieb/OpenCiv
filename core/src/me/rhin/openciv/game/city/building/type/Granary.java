package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.shared.stat.Stat;

public class Granary extends Building {

	public Granary(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 2);
		this.statLine.addValue(Stat.MAINTENANCE, -1);
	}

	@Override
	public int getProductionCost() {
		return 40;
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
}
