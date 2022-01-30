package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class LowHealthNode extends UnitNode {

	public LowHealthNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		if (unit.getHealth() <= 30)
			setStatus(BehaviorStatus.SUCCESS);

		setStatus(BehaviorStatus.FAILURE);
	}

}
