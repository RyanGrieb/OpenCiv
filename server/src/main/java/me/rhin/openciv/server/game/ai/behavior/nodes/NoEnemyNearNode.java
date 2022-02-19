package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class NoEnemyNearNode extends UnitNode {

	public NoEnemyNearNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public BehaviorResult tick() {

		ArrayList<Tile> observedTiles = unit.getPlayerOwner().getObservedTiles();

		for (Tile tile : observedTiles) {

			// If the tile contains enemy unit or city...
			if (tile.getEnemyAttackableEntity(unit.getPlayerOwner()) != null) {

				if (tile.getDistanceFrom(unit.getTile()) < 100) { // 4-5ish tiles
					return new BehaviorResult(BehaviorStatus.FAILURE, this);
				}
			}
		}

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
