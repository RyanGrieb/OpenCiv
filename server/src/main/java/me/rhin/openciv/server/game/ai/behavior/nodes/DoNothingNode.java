package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class DoNothingNode extends UnitNode {

	public DoNothingNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		setStatus(BehaviorStatus.SUCCESS);
	}

}
