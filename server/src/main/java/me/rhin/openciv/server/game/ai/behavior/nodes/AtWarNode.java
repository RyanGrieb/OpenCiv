package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;

public class AtWarNode extends Node {

	private Unit unit;

	public AtWarNode(Unit unit) {
		super("AtWarNode");
		this.unit = unit;
	}

	@Override
	public void tick() {

		if (unit.getPlayerOwner().getDiplomacy().inWar())
			setStatus(BehaviorStatus.SUCCESS);
		else
			setStatus(BehaviorStatus.FAILURE);
	}

}
