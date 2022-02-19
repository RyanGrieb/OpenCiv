package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.type.Settler;

/**
 * Returns SUCCESS if the the number of turns since the player produced a
 * settler is > 14
 * 
 * @author Ryan
 *
 */
public class SettlerCooldownNode extends CityNode {

	public SettlerCooldownNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {

		// Don't start immediately producing settlers
		if (Server.getInstance().getInGameState().getCurrentTurn() < 10) {
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		if (city.getProducibleItemManager().turnsSinceProduced(Settler.class) > 14) {
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
