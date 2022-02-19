package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class UpgradeUnitNode extends UnitNode {

	public UpgradeUnitNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		unit.upgrade();
		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
