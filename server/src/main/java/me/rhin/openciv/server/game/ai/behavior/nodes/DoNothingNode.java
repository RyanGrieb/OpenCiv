package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;

public class DoNothingNode extends Node {

	public DoNothingNode(String name) {
		super(name);
	}

	@Override
	public BehaviorResult tick() {
		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
