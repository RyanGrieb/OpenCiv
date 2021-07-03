package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;

public abstract class UnitItem implements ProductionItem {

	protected City city;
	
	public UnitItem(City city) {
		this.city = city;
	}
	
	@Override
	public String getCategory() {
		return "Units";
	}

}
