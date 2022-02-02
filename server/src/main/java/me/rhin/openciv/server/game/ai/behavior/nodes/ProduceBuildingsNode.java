package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.server.game.production.ProductionItem;

public class ProduceBuildingsNode extends CityNode {

	public ProduceBuildingsNode(City city, String name) {
		super(city, name);
	}

	@Override
	public void tick() {

		ProducibleItemManager itemManager = city.getProducibleItemManager();

		ProductionItem topItem = null;

		for (ProductionItem productionItem : itemManager.getProducibleItems()) {

			if (!(productionItem instanceof Building))
				continue;

			if (topItem == null || topItem.getAIValue() < productionItem.getAIValue())
				topItem = productionItem;
		}

		if (topItem == null)
			return;

		itemManager.setProducingItem(topItem.getName());
	}

}
