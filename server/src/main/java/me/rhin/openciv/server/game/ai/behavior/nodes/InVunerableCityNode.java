package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;

public class InVunerableCityNode extends UnitNode {

	public InVunerableCityNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		AbstractPlayer player = unit.getPlayerOwner();

		City city = player.getNearestCityToEnemy();

		if (unit.getTile().getTerritory() != null && unit.getTile().getTerritory().equals(city))
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
