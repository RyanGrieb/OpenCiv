package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.PlayerNode;

public class NotResearchingNode extends PlayerNode {

	public NotResearchingNode(AbstractPlayer player, String name) {
		super(player, name);
	}

	@Override
	public BehaviorResult tick() {
		if (player.getResearchTree().getTechResearching() == null) {
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
