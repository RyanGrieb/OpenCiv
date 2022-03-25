package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Palace extends Building {

	public Palace(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);
		statLine.addValue(Stat.GOLD_GAIN, 3);
		statLine.addValue(Stat.SCIENCE_GAIN, 3);
		statLine.addValue(Stat.PRODUCTION_GAIN, 3);
		statLine.addValue(Stat.FAITH_GAIN, 10);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return -1;
	}

	@Override
	public float getGoldCost() {
		return 0;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return false;
	}

	@Override
	public String getName() {
		return "Palace";
	}
}
