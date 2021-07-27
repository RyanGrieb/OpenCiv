package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;

public class Monument extends Building {

	public Monument(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 2);
		this.statLine.addValue(Stat.MAINTENANCE, -1);
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
	public boolean meetsProductionRequirements() {
		return true;
	}
	
	@Override
	public String getName() {
		return "Monument";
	}
}
