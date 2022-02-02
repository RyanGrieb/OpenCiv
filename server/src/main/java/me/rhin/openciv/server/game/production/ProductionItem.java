package me.rhin.openciv.server.game.production;

import me.rhin.openciv.server.game.AbstractPlayer;

public interface ProductionItem {
	public String getName();

	public float getProductionCost();

	public boolean meetsProductionRequirements();

	public void create();

	public float getGoldCost();
	
	public float getFaithCost();

	public void setProductionModifier(float modifier);

	public float getProductionModifier();
	
	public float getAIValue();

	public boolean isWonder();
}
