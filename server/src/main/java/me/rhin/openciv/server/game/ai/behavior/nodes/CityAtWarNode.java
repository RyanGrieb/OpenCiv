package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class CityAtWarNode extends CityNode {

	public CityAtWarNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {

		if (city.getPlayerOwner().getDiplomacy().inWar())
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
