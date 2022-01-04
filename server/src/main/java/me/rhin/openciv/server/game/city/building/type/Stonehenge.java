package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;

public class Stonehenge extends Building implements Wonder {

	public Stonehenge(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 6);
	}

	@Override
	public boolean meetsProductionRequirements() {
		return !Server.getInstance().getInGameState().getWonders().isBuilt(getClass())
				&& city.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class);
	}

	@Override
	public float getGoldCost() {
		return -1;
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