package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class MeleeAttackNode extends UnitNode {

	public MeleeAttackNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		for (Tile adjTile : unit.getTile().getAdjTiles()) {

			if (adjTile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {
				unit.attackEntity(adjTile.getEnemyAttackableEntity(unit.getPlayerOwner()));

				if (adjTile.getEnemyAttackableEntity(unit.getPlayerOwner()) == null)
					unit.moveToTile(adjTile);

				setStatus(BehaviorStatus.SUCCESS);
				return;
			}
		}

		setStatus(BehaviorStatus.FAILURE);
	}
}
