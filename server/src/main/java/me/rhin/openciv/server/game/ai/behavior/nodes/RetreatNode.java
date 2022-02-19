package me.rhin.openciv.server.game.ai.behavior.nodes;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;

public class RetreatNode extends UnitNode {

	private static final Logger LOGGER = LoggerFactory.getLogger(RetreatNode.class);

	public RetreatNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {

		AttackableEntity enemyEntity = null;
		Tile targetTile = null;

		// Init the enemyUnit near the unit.
		for (Tile tile : unit.getObservedTiles()) {
			if (tile.getTopEnemyUnit(unit.getPlayerOwner()) != null)
				enemyEntity = tile.getTopEnemyUnit(unit.getPlayerOwner());

			if (tile.getCity() != null && tile.getCity().getPlayerOwner().getDiplomacy().atWar(unit.getPlayerOwner()))
				enemyEntity = tile.getCity();
		}

		if (enemyEntity == null) {
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		}

		LOGGER.info("RetreatNode: Enemy adj to us");

		boolean waterUnit = unit.getUnitTypes().contains(UnitType.NAVAL);

		// Pick an observed tile, farthest away from the enemy.
		for (Tile tile : unit.getObservedTiles()) {

			if ((tile.getBaseTileType().hasProperty(TileProperty.WATER) && !waterUnit) || tile.getMovementCost() > 2)
				continue;

			if (targetTile == null
					|| tile.getDistanceFrom(enemyEntity.getTile()) > targetTile.getDistanceFrom(enemyEntity.getTile()))
				targetTile = tile;
		}

		LOGGER.info("Retreat: " + targetTile);

		// If were completely surrounded...
		if (targetTile == null) {
			// TODO: Implement last stand in the behavior tree?
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
		}

		boolean moved = unit.moveToTile(targetTile);

		if (moved)
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);
		else
			return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
