package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class NotProducingNode extends CityNode {

	public NotProducingNode(City city, String name) {
		super(city, name);
	}

	@Override
	public void tick() {
		
		if (city.getProducibleItemManager().getProducingItem() == null) {
			setStatus(BehaviorStatus.SUCCESS);
			return;
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
