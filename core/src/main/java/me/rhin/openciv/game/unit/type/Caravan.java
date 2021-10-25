package me.rhin.openciv.game.unit.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.unit.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.window.type.TradeWindow;

public class Caravan extends UnitItem {

	public Caravan(City city) {
		super(city);
	}

	public static class CaravanUnit extends Unit {

		private City city; // city headquarters.
		private boolean trading;

		public CaravanUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_CARAVAN);

			this.allowsMovement = false;
			this.city = standingTile.getCity();

			customActions.add(new TradeWindowAction(this));
		}

		@Override
		public void moveToTargetTile() {
			super.moveToTargetTile();

			trading = true;
			getPlayerOwner().unselectUnit();
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public float getMaxMovement() {
			return 1;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}

		public boolean isTrading() {
			return trading;
		}

		public void setTrading(boolean trading) {
			this.trading = trading;
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
							+ current.getMovementCost(adjTile);

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
					pathMovement += parentTile.getMovementCost(nextTile);
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

			if (pathMovement > 100) {
				return new Tradeable("Unnavigable: " + pathMovement, false);
			}

			return new Tradeable("In trade range", true);
		}
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

		private CaravanUnit caravan;

		public TradeWindowAction(Unit unit) {
			super(unit);

			this.caravan = (CaravanUnit) unit;
		}

		@Override
		public boolean act(float delta) {

			// Open trade window
			Civilization.getInstance().getWindowManager().toggleWindow(new TradeWindow(caravan));

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			return !caravan.isTrading();
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
	protected float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(AnimalHusbandryTech.class)
				&& city.getPlayerOwner().getStatLine().getStatValue(Stat.TRADE_ROUTE_AMOUNT) < city.getPlayerOwner()
						.getStatLine().getStatValue(Stat.MAX_TRADE_ROUTES);
	}

	@Override
	public String getName() {
		return "Caravan";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_CARAVAN;
	}

	@Override
	public String getDesc() {
		return "An ancient trader unit. \n+5 Gold each trade run. \n+5 Food each trade run.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
