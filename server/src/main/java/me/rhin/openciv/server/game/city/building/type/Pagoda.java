package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.religion.bonus.type.follower.PagodasBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Pagoda extends Building {

	public Pagoda(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 2);
		statLine.addValue(Stat.FAITH_GAIN, 2);
		statLine.addValue(Stat.MORALE_CITY, 10);

		return statLine;
	}

	@Override
	public boolean meetsProductionRequirements() {
		if (city.getCityReligion().getMajorityReligion() == null)
			return false;

		return city.getCityReligion().getMajorityReligion().hasBonus(PagodasBonus.class);
	}

	@Override
	public float getFaithCost() {
		return 200;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return -1;
	}

	@Override
	public String getName() {
		return "Pagoda";
	}
}
