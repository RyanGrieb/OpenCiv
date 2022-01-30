package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;

/**
 * Returns SUCCESS if there are injured units near the enemy
 * 
 * @author Ryan
 *
 */
public class InjuredUnitsNode extends UnitNode {

	public InjuredUnitsNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		for (Unit unit : unit.getPlayerOwner().getOwnedUnits()) {

			if (unit.getHealth() < 100) {

				for (Tile tile : unit.getObservedTiles()) {

					if (tile.getTopUnit() != null
							&& unit.getPlayerOwner().getDiplomacy().atWar(tile.getTopUnit().getPlayerOwner()))
						setStatus(BehaviorStatus.SUCCESS);
				}

			}
		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
