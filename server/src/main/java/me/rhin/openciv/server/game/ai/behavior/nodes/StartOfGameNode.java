package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;

public class StartOfGameNode extends Node {

	public StartOfGameNode(String name) {
		super(name);
	}

	@Override
	public BehaviorResult tick() {

		if (Server.getInstance().getInGameState().getCurrentTurn() <= 1) {
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
