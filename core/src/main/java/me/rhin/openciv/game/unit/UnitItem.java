package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatValue;

public abstract class UnitItem implements ProductionItem {

	public static enum UnitItemType {
		MELEE,
		RANGED,
		SUPPORT,
		NAVAL;
	}

	protected City city;
	protected float productionModifier;

	public UnitItem(City city) {
		this.city = city;
		this.productionModifier = 0;
	}

	public abstract UnitItemType getUnitItemType();

	protected abstract float getUnitProductionCost();

	@Override
	public String getCategory() {
		return "Units";
	}

	@Override
	public float getProductionCost() {
		StatValue prodModifier = new StatValue(getUnitProductionCost(), productionModifier);

		return prodModifier.getValue();
	}

	@Override
	public void setProductionModifier(float modifier) {
		this.productionModifier = modifier;
	}

	@Override
	public float getProductionModifier() {
		return productionModifier;
	}
}
