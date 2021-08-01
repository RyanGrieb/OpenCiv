package me.rhin.openciv.game.city.building;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatValue;

public abstract class Building implements ProductionItem {

	protected City city;
	protected StatLine statLine;
	protected float productionModifier;
	protected boolean built;

	public Building(City city) {
		this.city = city;
		this.statLine = new StatLine();
	}

	public abstract float getBuildingProductionCost();

	public abstract String getName();

	@Override
	public float getProductionCost() {
		StatValue prodModifier = new StatValue(getBuildingProductionCost(), productionModifier);

		return prodModifier.getValue();
	}

	@Override
	public void setProductionModifier(float productionModifier) {
		this.productionModifier = productionModifier;
	}

	@Override
	public float getProductionModifier() {
		return productionModifier;
	}

	@Override
	public String getCategory() {
		return "Buildings";
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public City getCity() {
		return city;
	}

	public void onBuilt() {
		built = true;
	}
}
