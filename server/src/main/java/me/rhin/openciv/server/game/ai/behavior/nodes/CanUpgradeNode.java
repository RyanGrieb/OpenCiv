package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.shared.stat.Stat;

public class CanUpgradeNode extends UnitNode {

	public CanUpgradeNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		if (unit.canUpgrade() && unit.getPlayerOwner().getStatLine().getStatValue(Stat.GOLD) >= 100) {
			setStatus(BehaviorStatus.SUCCESS);
		}

		setStatus(BehaviorStatus.FAILURE);
	}
}
