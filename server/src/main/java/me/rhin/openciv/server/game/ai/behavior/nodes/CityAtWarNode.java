package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class CityAtWarNode extends CityNode {

	public CityAtWarNode(City city, String name) {
		super(city, name);
	}

	@Override
	public void tick() {
		if (city.getPlayerOwner().getDiplomacy().inWar())
			setStatus(BehaviorStatus.SUCCESS);
		else
			setStatus(BehaviorStatus.FAILURE);
	}

}
