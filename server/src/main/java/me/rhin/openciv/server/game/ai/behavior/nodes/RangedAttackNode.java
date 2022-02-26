package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;

public class RangedAttackNode extends UnitNode {

	public RangedAttackNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {

		RangedUnit rangedUnit = (RangedUnit) unit;
		ArrayList<Tile> targetTiles = rangedUnit.getTargetableTiles();

		for (Tile tile : targetTiles) {

			if (tile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {

				AttackableEntity entity = tile.getEnemyAttackableEntity(unit.getPlayerOwner());

				rangedUnit.rangeAttack(entity);

				return new BehaviorResult(BehaviorStatus.SUCCESS, this);
			}
		}

		return null;
	}

}
