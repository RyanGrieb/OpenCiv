package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class UnitAI implements NextTurnListener {

	private FallbackNode mainNode;
	private Unit unit;

	public UnitAI(Unit unit, AIType aiType) {
		this.unit = unit;

		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, unit);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {

		// FIXME: This shouldn't be needed. But sometimes listeners don't clear for dead
		// units?
		if (!unit.isAlive())
			return;

		mainNode.tick();
	}

	public void clearListeners() {
		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

	public Node getMainNode() {
		return mainNode;
	}
}
