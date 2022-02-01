package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;

public class SettleNode extends UnitNode {

	public SettleNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		SettlerUnit settlerUnit = (SettlerUnit) unit;
		settlerUnit.settleCity();

		setStatus(BehaviorStatus.SUCCESS);
	}

}
