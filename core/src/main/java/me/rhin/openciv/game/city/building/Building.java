package me.rhin.openciv.game.city.building;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class Building implements ProductionItem {

	protected City city;
	protected StatLine statLine;

	public Building(City city) {
		this.city = city;
		this.statLine = new StatLine();
	}

	public abstract String getName();

	@Override
	public void setProductionModifier(float modifier) {
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
}
