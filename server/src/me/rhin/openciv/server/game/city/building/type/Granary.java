package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
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
		return "Monument";
	}

	@Override
	public boolean meetsProductionRequirements() {
		return false;
	}
}
