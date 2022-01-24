package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.ConditionNode;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.SequenceNode;
import me.rhin.openciv.server.game.unit.Unit;

public class AtWarNode extends ConditionNode {

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
			
		super.tick();
	}

}
