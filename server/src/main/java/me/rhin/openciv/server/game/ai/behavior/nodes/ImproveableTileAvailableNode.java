package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;

public class ImproveableTileAvailableNode extends UnitNode {

	public ImproveableTileAvailableNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		BuilderUnit builder = (BuilderUnit) unit;

		for (City city : unit.getPlayerOwner().getOwnedCities()) {

			for (Tile tile : city.getTerritory()) {

				if (builder.getImprovementFromTile(tile) != null) {
					setStatus(BehaviorStatus.SUCCESS);
					return;
				}

			}

		}

		setStatus(BehaviorStatus.FAILURE);
	}

}
