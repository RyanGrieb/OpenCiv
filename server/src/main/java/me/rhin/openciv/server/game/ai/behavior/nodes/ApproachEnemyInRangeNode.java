package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;

public class ApproachEnemyInRangeNode extends UnitNode {

	public ApproachEnemyInRangeNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {

		RangedUnit rangedUnit = (RangedUnit) unit;

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
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		/*
		 * We iterate the path tiles. For each tile we iterate, we check if the ranged
		 * unit has an enemy in range. If that's the case. We break the loop, and move
		 * the unit to the tile where the ranged unit can shoot.
		 */

		ArrayList<Tile> pathTiles = unit.getPathTiles(closestEntity.getTile());

		Tile targetTile = null;

		mainLoop: for (int i = pathTiles.size() - 1; i >= 0; i--) {
			Tile pathTile = pathTiles.get(i);

			if (pathTile.equals(unit.getStandingTile()))
				continue;

			ArrayList<Tile> targetableTiles = rangedUnit.getTargetableTiles(pathTile);

			for (Tile tile : targetableTiles) {
				if (tile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {
					targetTile = pathTile;
					break mainLoop;
				}
			}
		}

		if (targetTile == null)
			return new BehaviorResult(BehaviorStatus.FAILURE, this);

		unit.moveToTile(targetTile);

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
