package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class AtWarNode extends UnitNode {

	public AtWarNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		if (unit.getPlayerOwner().getDiplomacy().inWar())
			setStatus(BehaviorStatus.SUCCESS);
		else
			setStatus(BehaviorStatus.FAILURE);
	}

}
