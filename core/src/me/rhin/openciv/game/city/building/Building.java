package me.rhin.openciv.game.city.building;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class Building implements ProductionItem {

	private City city;
	protected StatLine statLine;
	
	public Building(City city) {
		this.city = city;
		this.statLine = new StatLine();
	}

	public abstract String getName();

	public StatLine getStatLine() {
		return statLine;
	}
}
