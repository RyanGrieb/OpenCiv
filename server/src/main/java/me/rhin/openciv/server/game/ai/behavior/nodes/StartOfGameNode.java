package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;

public class StartOfGameNode extends Node {

	public StartOfGameNode(String name) {
		super(name);
	}

	@Override
	public void tick() {

		if (Server.getInstance().getInGameState().getCurrentTurn() <= 1) {
			setStatus(BehaviorStatus.SUCCESS);
			return;
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
