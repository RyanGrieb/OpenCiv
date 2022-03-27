package me.rhin.openciv.server.game.ai;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class UnitAI implements Listener {

	private FallbackNode mainNode;
	private Unit unit;

	public UnitAI(Unit unit, AIType aiType) {
		this.unit = unit;

		mainNode = new FallbackNode("Main Node");
		aiType.initBehaviorTree(mainNode, unit);

		Server.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onNextTurn() {

		// FIXME: This shouldn't be needed. But sometimes listeners don't clear for dead
		// units? I believe it's the ordering of our listeners.
		if (!unit.isAlive() || unit.getHealth() <= 0)
			return;

		mainNode.tick();
	}

	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(this);
	}

	public Node getMainNode() {
		return mainNode;
	}
}
