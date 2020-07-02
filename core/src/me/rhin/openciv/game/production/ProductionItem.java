package me.rhin.openciv.game.production;

public interface ProductionItem {
	
	public String getName();

	public int getProductionCost();

	public boolean meetsProductionRequirements();
}
