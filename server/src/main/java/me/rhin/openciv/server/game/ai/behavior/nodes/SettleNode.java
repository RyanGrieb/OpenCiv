package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;

public class SettleNode extends UnitNode {

	public SettleNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		SettlerUnit settlerUnit = (SettlerUnit) unit;
		settlerUnit.settleCity();

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
