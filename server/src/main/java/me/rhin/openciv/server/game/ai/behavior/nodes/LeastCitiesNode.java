package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class LeastCitiesNode extends CityNode {

	public LeastCitiesNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {
		AbstractPlayer leastCitiesPlayer = null;

		for (AbstractPlayer player : Server.getInstance().getAbstractPlayers()) {

			if (leastCitiesPlayer == null || player.getOwnedCities().size() < leastCitiesPlayer.getOwnedCities().size())
				leastCitiesPlayer = player;
		}

		if (leastCitiesPlayer == null) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		if (leastCitiesPlayer.equals(city.getPlayerOwner())) {
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
