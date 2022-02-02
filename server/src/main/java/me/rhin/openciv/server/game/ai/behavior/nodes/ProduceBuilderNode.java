package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class ProduceBuilderNode extends CityNode {

	public ProduceBuilderNode(City city, String name) {
		super(city, name);
	}

	@Override
	public void tick() {
		city.getProducibleItemManager().setProducingItem("Builder");
		setStatus(BehaviorStatus.SUCCESS);
	}

}
