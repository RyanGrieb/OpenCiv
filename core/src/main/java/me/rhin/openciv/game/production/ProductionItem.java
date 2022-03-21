package me.rhin.openciv.game.production;

import me.rhin.openciv.game.research.Unlockable;

public interface ProductionItem extends Unlockable {

	public float getProductionCost();

	public boolean meetsProductionRequirements();

	public String getCategory();

	public float getGoldCost();

	public float getFaithCost();

	public void setProductionModifier(float modifier);

	public float getProductionModifier();
}
