package me.rhin.openciv.game.production;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.type.Granary;
import me.rhin.openciv.game.city.building.type.Monument;
import me.rhin.openciv.game.unit.type.Warrior;

/**
 * Manager that handles the available items to be produced by cities. Producible
 * items are determined by whether the ProductionItem interface meets it's
 * production requirements.
 * 
 * @author Ryan
 *
 */
public class ProducibleItemManager {

	private HashMap<Class<? extends ProductionItem>, ProductionItem> possibleItems;

	public ProducibleItemManager(City city) {
		this.possibleItems = new HashMap<>();
		// At the start of the game, define
		possibleItems.put(Granary.class, new Granary(city));
		possibleItems.put(Monument.class, new Monument(city));
		possibleItems.put(Warrior.class, new Warrior());
	}

	public Collection<ProductionItem> getItems() {
		return possibleItems.values();
	}

	public ArrayList<ProductionItem> getProducibleItems() {
		ArrayList<ProductionItem> producibleItems = new ArrayList<>();

		for (ProductionItem item : possibleItems.values()) {
			if (item.meetsProductionRequirements())
				producibleItems.add(item);
		}

		return producibleItems;
	}
}
