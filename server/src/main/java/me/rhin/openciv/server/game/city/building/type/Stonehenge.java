package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Stonehenge extends Building implements Wonder {

	public Stonehenge(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FAITH_GAIN, 5);

		return statLine;
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