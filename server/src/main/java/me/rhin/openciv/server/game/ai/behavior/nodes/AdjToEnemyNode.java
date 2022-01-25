package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.Node;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class AdjToEnemyNode extends Node {

	private Unit unit;

	public AdjToEnemyNode(Unit unit) {
		super("AdjToEnemyNode");
		this.unit = unit;
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
