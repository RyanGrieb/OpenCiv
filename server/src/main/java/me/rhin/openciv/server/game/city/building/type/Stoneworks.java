package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;

public class Stoneworks extends Building {

	public Stoneworks(City city) {
		super(city);

		this.statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override	
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class);
	}

	@Override
	public float getGoldCost() {
		return 215;
	}

	@Override
	public String getName() {
		return "Stoneworks";
	}	

}
