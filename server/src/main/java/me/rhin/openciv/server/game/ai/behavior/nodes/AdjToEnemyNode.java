package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class AdjToEnemyNode extends UnitNode {

	public AdjToEnemyNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {
		for (Tile adjTile : unit.getTile().getAdjTiles()) {

			// If the player is adj to an enemy city or unit.
			if (adjTile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {
				return new BehaviorResult(BehaviorStatus.SUCCESS, this);
			}
		}

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
