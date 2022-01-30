package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;

public class MoveToDistantUnitNode extends UnitNode {

	public MoveToDistantUnitNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
	}

}
