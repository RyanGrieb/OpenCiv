package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.unit.UnitItem;

public class ProduceMilitaryNode extends CityNode {

	public ProduceMilitaryNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {
		ProducibleItemManager itemManager = city.getProducibleItemManager();

		if (!itemManager.producingMilitaryUnits())
			itemManager.clearProducingItem();
		else {
			return new BehaviorResult(BehaviorStatus.RUNNING, this);
		}

		UnitItem topUnitItem = null;
		for (ProductionItem productionItem : itemManager.getProducibleItems()) {

			if (!(productionItem instanceof UnitItem))
				continue;

			UnitItem unitItem = (UnitItem) productionItem;

			// FIXME: Add variety here. Archers, mounted units, naval. Not Just based on
			// pure combat strength.

			if (topUnitItem == null || topUnitItem.getBaseCombatStrength() < unitItem.getBaseCombatStrength())
				topUnitItem = unitItem;
		}

		if (topUnitItem == null) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		itemManager.setProducingItem(topUnitItem.getName());
		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
