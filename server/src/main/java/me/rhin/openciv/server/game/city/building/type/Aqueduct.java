package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.EngineeringTech;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Aqueduct extends Building implements Listener {

	public Aqueduct(City city) {
		super(city);

		Server.getInstance().getEventManager().addListener(this);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@EventHandler
	public void onCityGrowth(City city, float population, float foodSurplus) {
		if (!city.getBuildings().contains(this))
			return;

		city.getStatLine().setValue(Stat.FOOD_SURPLUS, foodSurplus * 0.4F);
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(EngineeringTech.class);
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Aqueduct";
	}
}
