package me.rhin.openciv.game.production;

import me.rhin.openciv.asset.TextureEnum;

public interface ProductionItem {

	public String getName();

	public TextureEnum getTexture();

	public float getProductionCost();

	public boolean meetsProductionRequirements();

	public String getCategory();

	public String getDesc();

	public float getGoldCost();

	public void setProductionModifier(float modifier);
}
