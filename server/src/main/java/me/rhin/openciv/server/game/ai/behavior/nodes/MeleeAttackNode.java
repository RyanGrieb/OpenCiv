package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.ExecutionNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

public class MeleeAttackNode extends ExecutionNode {

	private Unit unit;

	public MeleeAttackNode(Unit unit) {
		super("MeleeAttackNode");
		this.unit = unit;
	}

	@Override
	public void tick() {
		for (Tile adjTile : unit.getTile().getAdjTiles()) {
			if (adjTile.getTopUnit() != null
					&& unit.getPlayerOwner().getDiplomacy().atWar(adjTile.getTopUnit().getPlayerOwner())) {
				
				unit.attackEntity(adjTile.getTopUnit());
				setStatus(BehaviorStatus.SUCCESS);
				return;
			}
		}

		setStatus(BehaviorStatus.FAILURE);
	}
}
