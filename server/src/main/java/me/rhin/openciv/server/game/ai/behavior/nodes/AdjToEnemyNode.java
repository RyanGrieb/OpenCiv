package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class AdjToEnemyNode extends UnitNode {

	public AdjToEnemyNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {
		for (Tile adjTile : unit.getTile().getAdjTiles()) {
			if (adjTile.getTopUnit() != null
					&& unit.getPlayerOwner().getDiplomacy().atWar(adjTile.getTopUnit().getPlayerOwner())) {

				setStatus(BehaviorStatus.SUCCESS);
				return;
			}
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
