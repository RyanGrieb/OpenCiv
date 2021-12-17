package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.TheologyTech;
import me.rhin.openciv.shared.stat.Stat;

public class Garden extends Building {

	public Garden(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 1);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public void create() {
		super.create();

		city.getStatLine().addModifier(Stat.FOOD_GAIN, 0.1F);
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(TheologyTech.class);
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 120;
	}

	@Override
	public String getName() {
		return "Garden";
	}

}
