package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;

public class MeleeAttackNode extends UnitNode {

	public MeleeAttackNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		for (Tile adjTile : unit.getTile().getAdjTiles()) {

			if (adjTile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {

				AttackableEntity entity = adjTile.getEnemyAttackableEntity(unit.getPlayerOwner());

				boolean survivedAttack = entity.surviveAttack(unit);

				unit.attackEntity(entity);

				// FIXME: Redundant code. Figure out which one works. !survivedAttack doesn't
				// seem too
				if (!survivedAttack || entity.getHealth() <= 0) {
					unit.setMovement(unit.getMaxMovement());
					System.out.println("Attempting to move to tile");
					unit.moveToTile(entity.getTile());
					unit.setMovement(0);
				}

				setStatus(BehaviorStatus.SUCCESS);
				return;
			}
		}

		setStatus(BehaviorStatus.FAILURE);
	}
}
