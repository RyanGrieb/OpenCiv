package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class HasMovementNode extends UnitNode {

	public HasMovementNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		if (unit.getMovement() >= 1)
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
