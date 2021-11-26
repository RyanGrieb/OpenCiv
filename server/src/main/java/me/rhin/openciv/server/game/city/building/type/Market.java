package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.CurrencyTech;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;

public class Market extends Building {

	public Market(City city) {
		super(city);

		this.statLine.addValue(Stat.GOLD_GAIN, 2);

		// TODO: Implement gold for every trade route to this city.
	}

	@Override
	public void create() {
		super.create();

		city.getStatLine().addModifier(Stat.GOLD_GAIN, 0.25F);
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(CurrencyTech.class);
	}

	@Override
	public int getSpecialistSlots() {
		return 1;
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.MERCHANT;
	}

	@Override
	public String getName() {
		return "Market";
	}
}
