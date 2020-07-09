package me.rhin.openciv.game.production;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.type.Granary;
import me.rhin.openciv.game.city.building.type.Monument;
import me.rhin.openciv.game.unit.type.Galley;
import me.rhin.openciv.game.unit.type.Scout;
import me.rhin.openciv.game.unit.type.Settler;
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

	private City city;
	private HashMap<Class<? extends ProductionItem>, ProductionItem> possibleItems;
	private ProductionItem currentProductionItem;

	public ProducibleItemManager(City city) {
		this.city = city;
		this.possibleItems = new HashMap<>();
		// At the start of the game, define

		// FIXME: Maybe move this into the city class itself, I feel like it this class
		// shouldn't handle this. If not, we need to rename this class to represent a
		// relationship /w the city.
		possibleItems.put(Granary.class, new Granary(city));
		possibleItems.put(Monument.class, new Monument(city));
		possibleItems.put(Warrior.class, new Warrior());
		possibleItems.put(Settler.class, new Settler());
		possibleItems.put(Scout.class, new Scout());
		possibleItems.put(Galley.class, new Galley());
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

	public void setCurrentProductionItem(ProductionItem currentProductionItem) {
		Gdx.app.log(Civilization.LOG_TAG,
				"Requesting to build: " + currentProductionItem.getName() + " in city: " + city.getName());
		// TODO: Send packet.
	}

	public ProductionItem getCurrentProductionItem() {
		return currentProductionItem;
	}
}
