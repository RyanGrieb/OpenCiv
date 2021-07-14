package me.rhin.openciv.game.production;

import me.rhin.openciv.asset.TextureEnum;

public interface ProductionItem {

	public String getName();

	public TextureEnum getTexture();

	public int getProductionCost();

	public boolean meetsProductionRequirements();

	public String getCategory();

	public String getDesc();
}
