package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

public class CityNeedsBuilderNode extends CityNode {

	public CityNeedsBuilderNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {

		int ownedBuilders = 0;

		for (Unit unit : city.getPlayerOwner().getOwnedUnits()) {
			if (unit instanceof BuilderUnit)
				ownedBuilders++;
		}

		if (city.getProducibleItemManager().turnsSinceProduced(Builder.class) > 10
				&& ownedBuilders < city.getPlayerOwner().getOwnedCities().size()) {

			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
