package me.rhin.openciv.server.game.production;

public interface ProductionItem {
	public String getName();

	public int getProductionCost();

	public boolean meetsProductionRequirements();
}
