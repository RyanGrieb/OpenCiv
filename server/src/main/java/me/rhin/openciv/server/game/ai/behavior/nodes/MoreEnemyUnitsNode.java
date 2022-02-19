package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.civilization.type.Barbarians;
import me.rhin.openciv.server.game.unit.Unit;

public class MoreEnemyUnitsNode extends UnitNode {

	public MoreEnemyUnitsNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		AbstractPlayer player = unit.getPlayerOwner();

		int totalEnemyUnits = 0;
		for (AbstractPlayer enemyPlayer : player.getDiplomacy().getEnemies()) {

			if (enemyPlayer.getCiv() instanceof Barbarians)
				continue;

			totalEnemyUnits += enemyPlayer.getOwnedUnits().size();
		}

		if (totalEnemyUnits > player.getOwnedUnits().size())
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}
}
