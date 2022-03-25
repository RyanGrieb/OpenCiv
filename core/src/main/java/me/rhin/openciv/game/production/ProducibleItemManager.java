package me.rhin.openciv.game.production;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Queue;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.type.Amphitheater;
import me.rhin.openciv.game.city.building.type.Aqueduct;
import me.rhin.openciv.game.city.building.type.Bazaar;
import me.rhin.openciv.game.city.building.type.Chapel;
import me.rhin.openciv.game.city.building.type.Circus;
import me.rhin.openciv.game.city.building.type.Colosseum;
import me.rhin.openciv.game.city.building.type.Colossus;
import me.rhin.openciv.game.city.building.type.Forge;
import me.rhin.openciv.game.city.building.type.Garden;
import me.rhin.openciv.game.city.building.type.Granary;
import me.rhin.openciv.game.city.building.type.GreatLibrary;
import me.rhin.openciv.game.city.building.type.GreatPyramids;
import me.rhin.openciv.game.city.building.type.HangingGardens;
import me.rhin.openciv.game.city.building.type.Library;
import me.rhin.openciv.game.city.building.type.Lighthouse;
import me.rhin.openciv.game.city.building.type.MachuPicchu;
import me.rhin.openciv.game.city.building.type.Market;
import me.rhin.openciv.game.city.building.type.Mint;
import me.rhin.openciv.game.city.building.type.Monument;
import me.rhin.openciv.game.city.building.type.NationalCollege;
import me.rhin.openciv.game.city.building.type.Pagoda;
import me.rhin.openciv.game.city.building.type.Shrine;
import me.rhin.openciv.game.city.building.type.Stables;
import me.rhin.openciv.game.city.building.type.StatueOfAres;
import me.rhin.openciv.game.city.building.type.Stonehenge;
import me.rhin.openciv.game.city.building.type.Stoneworks;
import me.rhin.openciv.game.city.building.type.Walls;
import me.rhin.openciv.game.city.building.type.WaterMill;
import me.rhin.openciv.game.city.building.type.Workshop;
import me.rhin.openciv.game.notification.type.AvailableProductionNotification;
import me.rhin.openciv.game.unit.type.Archer;
import me.rhin.openciv.game.unit.type.Builder;
import me.rhin.openciv.game.unit.type.Caravan;
import me.rhin.openciv.game.unit.type.CargoShip;
import me.rhin.openciv.game.unit.type.Catapult;
import me.rhin.openciv.game.unit.type.ChariotArcher;
import me.rhin.openciv.game.unit.type.CompositeBowman;
import me.rhin.openciv.game.unit.type.Crossbowman;
import me.rhin.openciv.game.unit.type.Galley;
import me.rhin.openciv.game.unit.type.Horseman;
import me.rhin.openciv.game.unit.type.Legion;
import me.rhin.openciv.game.unit.type.Missionary;
import me.rhin.openciv.game.unit.type.Pikeman;
import me.rhin.openciv.game.unit.type.Scout;
import me.rhin.openciv.game.unit.type.Settler;
import me.rhin.openciv.game.unit.type.Spearman;
import me.rhin.openciv.game.unit.type.Swordsman;
import me.rhin.openciv.game.unit.type.Warrior;
import me.rhin.openciv.game.unit.type.WorkBoat;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.FaithBuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;
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

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private City city;
	private HashMap<String, ProductionItem> possibleItems;
	private Queue<ProducingItem> itemQueue;

	public ProducibleItemManager(City city) {
		this.city = city;
		this.possibleItems = new HashMap<>();
		this.itemQueue = new LinkedList<>();

		// Units
		possibleItems.put("Warrior", new Warrior(city));
		possibleItems.put("Settler", new Settler(city));
		possibleItems.put("Scout", new Scout(city));
		possibleItems.put("Galley", new Galley(city));
		possibleItems.put("Builder", new Builder(city));
		possibleItems.put("Work Boat", new WorkBoat(city));
		possibleItems.put("Archer", new Archer(city));
		possibleItems.put("Chariot Archer", new ChariotArcher(city));
		possibleItems.put("Catapult", new Catapult(city));
		possibleItems.put("Spearman", new Spearman(city));
		possibleItems.put("Caravan", new Caravan(city));
		possibleItems.put("Swordsman", new Swordsman(city));
		possibleItems.put("Legion", new Legion(city));
		possibleItems.put("Horseman", new Horseman(city));
		possibleItems.put("Cargo Ship", new CargoShip(city));
		possibleItems.put("Pikeman", new Pikeman(city));
		possibleItems.put("Composite Bowman", new CompositeBowman(city));
		possibleItems.put("Crossbowman", new Crossbowman(city));
		possibleItems.put("Missionary", new Missionary(city));

		// Buildings
		possibleItems.put("Granary", new Granary(city));
		possibleItems.put("Monument", new Monument(city));
		possibleItems.put("Market", new Market(city));
		possibleItems.put("Library", new Library(city));
		possibleItems.put("Water Mill", new WaterMill(city));
		possibleItems.put("Walls", new Walls(city));
		possibleItems.put("Shrine", new Shrine(city));
		possibleItems.put("Circus", new Circus(city));
		possibleItems.put("Colosseum", new Colosseum(city));
		possibleItems.put("Stables", new Stables(city));
		possibleItems.put("National College", new NationalCollege(city));
		possibleItems.put("Lighthouse", new Lighthouse(city));
		possibleItems.put("Stoneworks", new Stoneworks(city));
		possibleItems.put("Forge", new Forge(city));
		possibleItems.put("Workshop", new Workshop(city));
		possibleItems.put("Aqueduct", new Aqueduct(city));
		possibleItems.put("Mint", new Mint(city));
		possibleItems.put("Amphitheater", new Amphitheater(city));
		possibleItems.put("Garden", new Garden(city));
		possibleItems.put("Chapel", new Chapel(city));
		possibleItems.put("Pagoda", new Pagoda(city));
		possibleItems.put("Bazaar", new Bazaar(city));

		// Wonders
		possibleItems.put("Great Pyramids", new GreatPyramids(city));
		possibleItems.put("Great Library", new GreatLibrary(city));
		possibleItems.put("Hanging Gardens", new HangingGardens(city));
		possibleItems.put("Statue Of Ares", new StatueOfAres(city));
		possibleItems.put("Stonehenge", new Stonehenge(city));
		possibleItems.put("Machu Picchu", new MachuPicchu(city));
		possibleItems.put("Colossus", new Colossus(city));

		// FIXME: There should be a better way to do this than just checking if the
		// player matches
		if (city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new AvailableProductionNotification(city));
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
		LOGGER.info("Requesting to build: " + currentProductionItem.getName() + " in city: " + city.getName());
		SetProductionItemPacket packet = new SetProductionItemPacket();
		packet.setProductionItem(city.getName(), currentProductionItem.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void requestBuyProductionItem(ProductionItem productionItem) {
		LOGGER.info("Requesting to buy: " + productionItem.getName() + " in city: " + city.getName());
		BuyProductionItemPacket packet = new BuyProductionItemPacket();
		packet.setProductionItem(city.getName(), productionItem.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void requestFaithBuyProductionItem(ProductionItem productionItem) {
		LOGGER.info("Requesting to faith buy: " + productionItem.getName() + " in city: " + city.getName());
		FaithBuyProductionItemPacket packet = new FaithBuyProductionItemPacket();
		packet.setProductionItem(city.getName(), productionItem.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void requestQueueProductionItem(ProductionItem productionItem) {
		LOGGER.info("Requesting to queue item: " + productionItem.getName() + " in city: " + city.getName());
		QueueProductionItemPacket packet = new QueueProductionItemPacket();
		packet.setProductionItem(city.getName(), productionItem.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void applyProduction(float productionAmount) {
		itemQueue.peek().applyProduction(productionAmount);
	}

	public void setCurrentProductionItem(String itemName) {
		itemQueue.clear();
		itemQueue.add(new ProducingItem(possibleItems.get(itemName)));
	}

	public void queueProductionItem(String itemName) {
		itemQueue.add(new ProducingItem(possibleItems.get(itemName)));
	}

	public Queue<ProducingItem> getItemQueue() {
		return itemQueue;
	}

	public ProducingItem getCurrentProducingItem() {
		return itemQueue.peek();
	}
}
