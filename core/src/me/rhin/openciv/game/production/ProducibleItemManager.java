package me.rhin.openciv.game.production;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Queue;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.type.Granary;
import me.rhin.openciv.game.city.building.type.Market;
import me.rhin.openciv.game.city.building.type.Monument;
import me.rhin.openciv.game.unit.type.Archer;
import me.rhin.openciv.game.unit.type.Builder;
import me.rhin.openciv.game.unit.type.Galley;
import me.rhin.openciv.game.unit.type.Scout;
import me.rhin.openciv.game.unit.type.Settler;
import me.rhin.openciv.game.unit.type.Warrior;
import me.rhin.openciv.game.unit.type.WorkBoat;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;

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
	private HashMap<String, ProductionItem> possibleItems;
	private Queue<ProducingItem> itemQueue;
	private boolean queueEnabled;

	public ProducibleItemManager(City city) {
		this.city = city;
		this.possibleItems = new HashMap<>();
		this.itemQueue = new LinkedList<>();
		this.queueEnabled = false;

		possibleItems.put("Granary", new Granary(city));
		possibleItems.put("Monument", new Monument(city));
		possibleItems.put("Market", new Market(city));
		possibleItems.put("Warrior", new Warrior(city));
		possibleItems.put("Settler", new Settler(city));
		possibleItems.put("Scout", new Scout(city));
		possibleItems.put("Galley", new Galley(city));
		possibleItems.put("Builder", new Builder(city));
		possibleItems.put("Work Boat", new WorkBoat(city));
		possibleItems.put("Archer", new Archer(city));
	}

	public HashMap<String, ProductionItem> getPossibleItems() {
		return possibleItems;
	}

	public ArrayList<ProductionItem> getProducibleItems() {
		ArrayList<ProductionItem> producibleItems = new ArrayList<>();

		for (ProductionItem item : possibleItems.values()) {
			if (item.meetsProductionRequirements())
				producibleItems.add(item);
		}

		return producibleItems;
	}

	public void requestSetProductionItem(ProductionItem currentProductionItem) {
		Gdx.app.log(Civilization.LOG_TAG,
				"Requesting to build: " + currentProductionItem.getName() + " in city: " + city.getName());

		SetProductionItemPacket packet = new SetProductionItemPacket();
		packet.setProductionItem(city.getName(), currentProductionItem.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void applyProduction(float productionAmount) {
		itemQueue.peek().applyProduction(productionAmount);
	}

	public void setCurrentProductionItem(String itemName) {
		if (queueEnabled)
			itemQueue.add(new ProducingItem(possibleItems.get(itemName)));
		else {
			itemQueue.clear();
			itemQueue.add(new ProducingItem(possibleItems.get(itemName)));
		}
	}

	public Queue<ProducingItem> getItemQueue() {
		return itemQueue;
	}

	public ProducingItem getCurrentProducingItem() {
		return itemQueue.peek();
	}
}
