package me.rhin.openciv.game.unit;

import java.util.ArrayList;
import java.util.Arrays;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.ui.window.type.TradeWindow;

public abstract class TradeUnit extends Unit {

	private City city;
	private boolean trading;

	public TradeUnit(UnitParameter unitParameter, TextureEnum assetEnum) {
		super(unitParameter, assetEnum);

		this.allowsMovement = false;
		this.city = standingTile.getCity();
		this.trading = false;

		customActions.add(new TradeWindowAction(this));
	}

	public static class Tradeable {

		private String reason;
		private boolean tradeable;

		public Tradeable(String reason, boolean tradeable) {
			this.reason = reason;
			this.tradeable = tradeable;
		}

		public String getReason() {
			return reason;
		}

		public boolean isTradeable() {
			return tradeable;
		}
	}

	public static class TradeWindowAction extends AbstractAction {

		private TradeUnit tradeUnit;

		public TradeWindowAction(Unit unit) {
			super(unit);

			this.tradeUnit = (TradeUnit) unit;
		}

		@Override
		public boolean act(float delta) {

			// Open trade window
			Civilization.getInstance().getWindowManager().toggleWindow(new TradeWindow(tradeUnit));

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			return !tradeUnit.isTrading();
		}

		@Override
		public String getName() {
			return "Trade";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.ICON_GOLD;
		}
	}

	@Override
	public void moveToTargetTile() {
		super.moveToTargetTile();

		trading = true;
		getPlayerOwner().unselectUnit();
	}

	public Tradeable canTrade(City city) {

		if (this.city.equals(city))
			return new Tradeable("Caravan headquarters", false);

		Tile targetTile = city.getTile();

		int h = 0;
		ArrayList<Tile> openSet = new ArrayList<>();
		Tile[][] cameFrom = new Tile[GameMap.WIDTH][GameMap.HEIGHT];
		float[][] gScores = new float[GameMap.WIDTH][GameMap.HEIGHT];
		float[][] fScores = new float[GameMap.WIDTH][GameMap.HEIGHT];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, GameMap.MAX_NODES);
		for (float[] fScore : fScores)
			Arrays.fill(fScore, GameMap.MAX_NODES);

		gScores[standingTile.getGridX()][standingTile.getGridY()] = 0;
		fScores[standingTile.getGridX()][standingTile.getGridY()] = h;
		openSet.add(standingTile); // h or 0 ???

		while (openSet.size() > 0) {

			// Get the current tileNode /w the lowest fScore[] value.
			// FIXME: This can be O(1) /w a proper priority queue.
			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

				if (tenativeGScore < gScores[adjTile.getGridX()][adjTile.getGridY()]) {

					cameFrom[adjTile.getGridX()][adjTile.getGridY()] = current;
					gScores[adjTile.getGridX()][adjTile.getGridY()] = tenativeGScore;

					float adjFScore = gScores[adjTile.getGridX()][adjTile.getGridY()] + h;
					fScores[adjTile.getGridX()][adjTile.getGridY()] = adjFScore;
					if (!openSet.contains(adjTile)) {
						openSet.add(adjTile);
					}
				}
			}
		}

		// Iterate through the parent array to get back to the origin tile.

		Tile parentTile = cameFrom[targetTile.getGridX()][targetTile.getGridY()];

		// If it's moving to itself or there isn't a valid path
		if (parentTile == null) {
			return new Tradeable("Unknown path", false);
		}

		int iterations = 0;
		float pathMovement = 0;
		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile == null)
				nextTile = targetTile;

			if (!parentTile.equals(standingTile)) {
				pathMovement += getMovementCost(nextTile, parentTile);
			}

			if (parentTile.equals(targetTile)) {
				break;
			}

			if (iterations >= GameMap.MAX_NODES) {
				Gdx.app.log(Civilization.LOG_TAG, "ERROR: Pathing iteration error");
				break;
			}

			parentTile = nextTile;
			iterations++;
		}

		if (iterations > 10) {
			return new Tradeable("Too distant", false);
		}

		System.out.println(city.getName() + "," + pathMovement);

		if (pathMovement > 100) {
			return new Tradeable("Unnavigable: " + pathMovement, false);
		}

		return new Tradeable("In trade range", true);
	}

	public boolean isTrading() {
		return trading;
	}

	public void setTrading(boolean trading) {
		this.trading = trading;
	}
}
