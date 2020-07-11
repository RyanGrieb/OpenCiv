package me.rhin.openciv.server.game.production;

import me.rhin.openciv.server.game.city.City;

public interface ProductionItem {
	public String getName();

	public int getProductionCost();

	public boolean meetsProductionRequirements();

	public void create(City city);
}
