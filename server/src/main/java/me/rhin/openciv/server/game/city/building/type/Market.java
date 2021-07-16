package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.shared.city.SpecialistType;

public class Market extends Building {

	public Market(City city) {
		super(city);
	}

	@Override
	public int getProductionCost() {
		return 100;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
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
