package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.Random;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.UnitNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;

public class WanderToTileNode extends UnitNode {

	private Tile targetTile;

	public WanderToTileNode(Unit unit, String name) {
		super(unit, name);
	}

	@Override
	public void tick() {

		Random rnd = new Random();
		boolean waterUnit = unit.getUnitTypes().contains(UnitType.NAVAL);

		while (targetTile == null || targetTile.equals(unit.getStandingTile())
				|| (targetTile.containsTileProperty(TileProperty.WATER) && !waterUnit)
				|| targetTile.getMovementCost() > 2) {

			targetTile = Server.getInstance().getMap().getTiles()[rnd.nextInt(
					Server.getInstance().getMap().getWidth())][rnd.nextInt(Server.getInstance().getMap().getHeight())];
		}

		boolean moved = unit.moveToTile(targetTile);
		if (!moved) {
			targetTile = null;
			tick();
		}

		// FIXME: Set it to success?
		setStatus(BehaviorStatus.SUCCESS);
	}

}
