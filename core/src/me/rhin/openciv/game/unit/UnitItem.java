package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.production.ProductionItem;

public abstract class UnitItem implements ProductionItem {

	//FIXME: Would an abstract class like this be the best approach/
	
	@Override
	public String getCategory() {
		return "Units";
	}

}
