package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.research.type.MathematicsTech;
import me.rhin.openciv.shared.stat.Stat;

public class HangingGardens extends Building implements Wonder {

	public HangingGardens(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 10);
		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
	}

	@Override
	public float getBuildingProductionCost() {
		return 250;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MathematicsTech.class)
				&& !Server.getInstance().getInGameState().getWonders().isBuilt(getClass());
	}

	@Override
	public String getName() {
		return "Hanging Gardens";
	}
}
