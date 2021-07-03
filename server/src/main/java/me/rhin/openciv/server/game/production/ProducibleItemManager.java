package me.rhin.openciv.server.game.production;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Queue;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.type.Granary;
import me.rhin.openciv.server.game.city.building.type.Market;
import me.rhin.openciv.server.game.city.building.type.Monument;
import me.rhin.openciv.server.game.unit.type.Archer;
import me.rhin.openciv.server.game.unit.type.Builder;
import me.rhin.openciv.server.game.unit.type.Galley;
import me.rhin.openciv.server.game.unit.type.Scout;
import me.rhin.openciv.server.game.unit.type.Settler;
import me.rhin.openciv.server.game.unit.type.Warrior;
import me.rhin.openciv.server.game.unit.type.WorkBoat;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.stat.Stat;

/**
 * Manager that handles the available items to be produced by cities. Producible
 * items are determined by whether the ProductionItem interface meets it's
 * production requirements.
 * 
 * @author Ryan
 *
 */
public class ProducibleItemManager implements NextTurnListener {

	private City city;
	private HashMap<String, ProductionItem> possibleItems;

	// Items that the city has already applied production to
	private HashMap<String, ProducingItem> appliedProductionItems;

	// A queue of items to produce
	private Queue<ProducingItem> itemQueue;
	private boolean queueEnabled;

	public ProducibleItemManager(City city) {
		this.city = city;
		this.possibleItems = new HashMap<>();
		this.appliedProductionItems = new HashMap<>();
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

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
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

	public void setProducingItem(String itemName) {
		if (possibleItems.get(itemName) == null)
			return;

		// Prevent buildings being added twice in the queue
		if (possibleItems.get(itemName) instanceof Building) {
			for (ProducingItem producingItem : itemQueue) {
				if (producingItem.getProductionItem().getName().equals(itemName))
					return;
			}
		}

		if (!queueEnabled) {
			// TODO: Implement appliedProductionItems here to save applied production.
			itemQueue.clear();
		}

		System.out.println("Adding to queue");
		itemQueue.add(new ProducingItem(possibleItems.get(itemName)));
	}

	@Override
	public void onNextTurn() {
		ProducingItem producingItem = itemQueue.peek();

		if (producingItem == null)
			return;

		producingItem.applyProduction(city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		Json json = new Json();

		if (producingItem.getAppliedProduction() > producingItem.getProductionItem().getProductionCost()) {
			itemQueue.remove();

			// FIXME: Not only should this apply to the queue. We should save the leftover
			// production if the queue is not enabled.
			if (itemQueue.peek() != null) {
				itemQueue.peek().applyProduction(itemQueue.peek().getAppliedProduction()
						- producingItem.getProductionItem().getProductionCost());
			}

			producingItem.getProductionItem().create(city);

			FinishProductionItemPacket packet = new FinishProductionItemPacket();
			packet.setProductionItem(city.getName(), producingItem.getProductionItem().getName());
			city.getPlayerOwner().getConn().send(json.toJson(packet));
			return;
		}

		ApplyProductionToItemPacket packet = new ApplyProductionToItemPacket();
		packet.setProductionItem(city.getName(), producingItem.getProductionItem().getName(),
				city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));
		city.getPlayerOwner().getConn().send(json.toJson(packet));
	}
}
