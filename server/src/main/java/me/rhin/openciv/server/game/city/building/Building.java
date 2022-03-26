package me.rhin.openciv.server.game.city.building;

import java.util.Map.Entry;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.listener.BuildingConstructedListener.BuildingConstructedEvent;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class Building implements ProductionItem {

	private static final Logger LOGGER = LoggerFactory.getLogger(Building.class);

	protected City city;
	protected boolean built;
	private float productionModifier;

	public Building(City city) {
		this.city = city;
	}

	public abstract StatLine getStatLine();

	public abstract float getBuildingProductionCost();

	public abstract String getName();

	@Override
	public void create() {

		if (city.containsBuilding(this.getClass()))
			return;

		city.addBuilding(this);
		city.getProducibleItemManager().getPossibleItems().remove(getName());
		built = true;

		if (this instanceof Wonder) {
			LOGGER.info("Server - " + city.getPlayerOwner().getName() + " built wonder: " + getName());
			Server.getInstance().getInGameState().getWonders().setBuilt(getClass());
		}

		Server.getInstance().getEventManager().fireEvent(new BuildingConstructedEvent(city, this));
	}

	@Override
	public float getProductionCost() {
		StatValue prodModifier = new StatValue(getBuildingProductionCost(), productionModifier);

		return prodModifier.getValue();
	}

	@Override
	public float getFaithCost() {
		return -1;
	}

	@Override
	public void setProductionModifier(float modifier) {
		this.productionModifier = modifier;
	}

	@Override
	public float getAIValue() {

		// FIXME: Account for wonders

		float value = 0;

		for (Entry<Stat, StatValue> entry : getStatLine().getStatValues().entrySet()) {
			// FIXME: We can do better than this
			float modifier = 0;
			float baseValue = entry.getValue().getValue();
			switch (entry.getKey()) {
			case SCIENCE_GAIN:
				modifier = 3;
				break;

			case HERITAGE_GAIN:
				modifier = 4;
				break;

			case PRODUCTION_GAIN:
				modifier = 2;
				break;

			case GOLD_GAIN:
				modifier = 1;
				break;

			case FOOD_GAIN:
				modifier = 2;
				break;

			case MORALE_CITY:
				modifier = 2;
				break;

			default:
				break;
			}

			value += baseValue * modifier;
		}

		value *= 8;

		return value;
	}

	@Override
	public boolean isWonder() {
		return this instanceof Wonder;
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
}
