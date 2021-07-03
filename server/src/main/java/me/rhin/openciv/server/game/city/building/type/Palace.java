package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;

public class Palace extends Building {

	public Palace(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
		this.statLine.addValue(Stat.GOLD_GAIN, 3);
		this.statLine.addValue(Stat.SCIENCE_GAIN, 3);
		this.statLine.addValue(Stat.PRODUCTION_GAIN, 3);
	}

	@Override
	public int getProductionCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return false;
	}
}
