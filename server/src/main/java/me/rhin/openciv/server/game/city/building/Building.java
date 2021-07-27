package me.rhin.openciv.server.game.city.building;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.listener.BuildingConstructedListener.BuildingConstructedEvent;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatValue;

public abstract class Building implements ProductionItem {

	protected City city;
	protected StatLine statLine;
	private float productionModifier;

	public Building(City city) {
		this.city = city;
		this.statLine = new StatLine();
	}

	public abstract float getBuildingProductionCost();

	public abstract String getName();

	@Override
	public void create() {

		if (city.containsBuilding(this.getClass()))
			return;

		city.addBuilding(this);
		city.getProducibleItemManager().getPossibleItems().remove(getName());

		Server.getInstance().getEventManager().fireEvent(new BuildingConstructedEvent(city, this));
	}

	@Override
	public float getProductionCost() {
		StatValue prodModifier = new StatValue(getBuildingProductionCost(), productionModifier);

		return prodModifier.getValue();
	}

	@Override
	public void setProductionModifier(float modifier) {
		this.productionModifier = modifier;
	}

	public float getProductionModifier() {
		return productionModifier;
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
