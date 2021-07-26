package me.rhin.openciv.server.game.city.building;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.shared.city.SpecialistType;
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
	public void create() {
		city.addBuilding(this);
		city.getProducibleItemManager().getPossibleItems().remove(getName());
	}

	@Override
	public void setProductionModifier(float modifier) {
		//TODO: Implement me:
	}

	public int getSpecialistSlots() {
		return 0;
	}

	public SpecialistType getSpecialistType() {
		return null;
	}

	public StatLine getStatLine() {
		return statLine;
	}
}
