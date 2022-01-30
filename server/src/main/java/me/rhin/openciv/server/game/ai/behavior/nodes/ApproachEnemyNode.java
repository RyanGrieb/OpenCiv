package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachEnemyNode extends UnitNode {

	public ApproachEnemyNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		AttackableEntity closestEntity = null;

		ArrayList<Tile> observedTiles = unit.getPlayerOwner().getObservedTiles();

		for (Tile tile : observedTiles) {

			if (tile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {

				if (closestEntity == null || unit.getStandingTile().getDistanceFrom(tile) < unit.getStandingTile()
						.getDistanceFrom(closestEntity.getTile()))
					closestEntity = tile.getTopEnemyUnit(unit.getPlayerOwner());
			}
		}

		if (closestEntity == null) {
			setStatus(BehaviorStatus.FAILURE);
			return;
		}

		unit.moveToTile(closestEntity.getTile());
		setStatus(BehaviorStatus.SUCCESS);
	}

}
