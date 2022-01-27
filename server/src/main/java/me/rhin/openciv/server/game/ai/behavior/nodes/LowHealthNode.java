package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class LowHealthNode extends Node {

	private Unit unit;

	public LowHealthNode(Unit unit) {
		super("LowHealthNode");
		this.unit = unit;
	}

	@Override
	public void tick() {
		if (unit.getHealth() <= 30)
			setStatus(BehaviorStatus.SUCCESS);

		setStatus(BehaviorStatus.FAILURE);
	}

}
