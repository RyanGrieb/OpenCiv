package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;

public class LeastCitiesNode extends CityNode {

	public LeastCitiesNode(City city, String name) {
		super(city, name);
	}

	@Override
	public void tick() {
		AbstractPlayer leastCitiesPlayer = null;

		for (AbstractPlayer player : Server.getInstance().getAbstractPlayers()) {

			if (leastCitiesPlayer == null || player.getOwnedCities().size() < leastCitiesPlayer.getOwnedCities().size())
				leastCitiesPlayer = player;
		}

		if (leastCitiesPlayer == null) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		if (leastCitiesPlayer.equals(city.getPlayerOwner())) {
			setStatus(BehaviorStatus.SUCCESS);
			return;
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
