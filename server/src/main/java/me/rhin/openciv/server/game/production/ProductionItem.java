package me.rhin.openciv.server.game.production;

public interface ProductionItem {
	public String getName();

	public float getProductionCost();

	public boolean meetsProductionRequirements();

	public void create();

	public float getGoldCost();

	public void setProductionModifier(float modifier);

	public float getProductionModifier();
}
