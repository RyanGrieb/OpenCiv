package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

public class NotBuildingNode extends UnitNode {

	public NotBuildingNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		BuilderUnit builder = (BuilderUnit) unit;

		if (builder.isBuilding()) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		setStatus(BehaviorStatus.SUCCESS);
	}

}
