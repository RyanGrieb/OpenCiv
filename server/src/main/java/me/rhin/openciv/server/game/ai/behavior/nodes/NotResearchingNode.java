package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.PlayerNode;

public class NotResearchingNode extends PlayerNode {

	public NotResearchingNode(AbstractPlayer player, String name) {
		super(player, name);
	}

	@Override
	public void tick() {
		if (player.getResearchTree().getTechResearching() == null) {
			setStatus(BehaviorStatus.SUCCESS);
			return;
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
