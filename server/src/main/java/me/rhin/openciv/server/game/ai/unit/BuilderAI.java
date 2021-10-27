package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.server.listener.NextTurnListener;

public class BuilderAI extends UnitAI implements NextTurnListener {

	private Tile improvementTile;
	private TileImprovement tileImprovement;

	public BuilderAI(Unit unit) {
		super(unit);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		
		if (!unit.isAlive())
			return;
		
		BuilderUnit builder = (BuilderUnit) unit;

		if (builder.isBuilding())
			return;

		// Get the top tile to improve
		improvementTile = null;
		tileImprovement = null;

		//TODO: Maybe delete ourselfs?
		if (unit.getPlayerOwner().getOwnedCities().size() < 1)
			return;

		for (Tile tile : unit.getPlayerOwner().getCapitalCity().getTerritory()) {
			if (tile.getBaseTileType().getImprovements() != null) {
				for (TileImprovement improvement : tile.getBaseTileType().getImprovements()) {

					if (!unit.getPlayerOwner().getResearchTree().hasResearched(improvement.getRequiredTech())
							|| tile.containsTileProperty(TileProperty.WATER))
						continue;

					if (tileImprovement == null || improvement.getTileType().getStatLine()
							.isGreater(tileImprovement.getTileType().getStatLine())) {
						improvementTile = tile;
						tileImprovement = improvement;
					}
				}
			}
		}

		// If no valid tile to improve, return.
		if (improvementTile == null) {
			tileImprovement = null;
			return;
		}

		// If were not on it, move to target tile.
		if (!unit.getStandingTile().equals(improvementTile)) {
			ArrayList<Tile> pathTiles = new ArrayList<>();

			pathTiles = getPathTiles(improvementTile);
			// If we don't have a valid path, return.
			if (pathTiles.size() < 1) {
				improvementTile = null;
				tileImprovement = null;
				return;
			}

			Tile pathingTile = stepTowardTarget(pathTiles);
			moveToTargetTile(pathingTile);
			return;
		}

		// If were standing on it, call build function. return.
		builder.setBuilding(true);
		builder.setImprovement(tileImprovement.getName());
		builder.reduceMovement(2);
	}

	@Override
	public void clearListeners() {
		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, this);
	}
}
