package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.MetalCastingTech;
import me.rhin.openciv.shared.stat.Stat;

public class Workshop extends Building {

	public Workshop(City city) {
		super(city);
		
		this.statLine.addValue(Stat.PRODUCTION_GAIN, 2);
		this.statLine.addValue(Stat.MAINTENANCE, 2);
	}

	@Override
	public void create() {
		super.create();
		
		city.getStatLine().addModifier(Stat.PRODUCTION_GAIN, 0.1F);
	}
	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MetalCastingTech.class);
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 120;
	}

	@Override
	public String getName() {
		return "Workshop";
	}

}
