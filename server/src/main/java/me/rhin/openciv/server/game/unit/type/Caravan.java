package me.rhin.openciv.server.game.unit.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.stat.Stat;

public class Caravan extends UnitItem {

	public Caravan(City city) {
		super(city);
	}

	public static class CaravanUnit extends Unit {

		private City tradingCity;
		private City cityHeadquarters;
		private City movingToCity;

		public CaravanUnit(Player playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		}

		@Override
		public void onNextTurn() {
			if (tradingCity == null || cityHeadquarters == null)
				return;

			if (standingTile.equals(cityHeadquarters.getOriginTile())) {
				movingToCity = tradingCity;
			}

			if (standingTile.equals(tradingCity.getOriginTile())) {
				movingToCity = cityHeadquarters;
			}

			Tile targetTile = movingToCity.getOriginTile();

			int h = 0;
			ArrayList<Tile> openSet = new ArrayList<>();
			int width = Server.getInstance().getMap().getWidth();
			int height = Server.getInstance().getMap().getHeight();
			int maxNodes = Server.getInstance().getMap().getMaxNodes();

			Tile[][] cameFrom = new Tile[width][height];
			float[][] gScores = new float[width][height];
			float[][] fScores = new float[width][height];

			for (float[] gScore : gScores)
				Arrays.fill(gScore, maxNodes);
			for (float[] fScore : fScores)
				Arrays.fill(fScore, maxNodes);

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
				return;
			}

			Tile stepTile = null;

			int iterations = 0;
			float pathMovement = 0;
			while (parentTile != null) {
				Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

				if (nextTile == null)
					nextTile = targetTile;

				for (Tile adjTile : nextTile.getAdjTiles())
					if (adjTile.equals(standingTile)) {
						stepTile = nextTile;
						break;
					}

				if (!parentTile.equals(standingTile)) {
					pathMovement += getMovementCost(nextTile, parentTile);
				}

				if (parentTile.equals(targetTile)) {
					break;
				}

				if (iterations >= maxNodes) {
					System.out.println("pathing error");
					break;
				}

				parentTile = nextTile;
				iterations++;
			}

			if (stepTile == null)
				return;

			this.targetTile = stepTile;

			MoveUnitPacket packet = new MoveUnitPacket();
			packet.setUnit(getPlayerOwner().getName(), getID(), standingTile.getGridX(), standingTile.getGridY(),
					this.targetTile.getGridX(), this.targetTile.getGridY());

			Json json = new Json();

			for (Player player : Server.getInstance().getPlayers())
				player.getConn().send(json.toJson(packet));

			this.moveToTargetTile();

			if (stepTile.equals(movingToCity.getOriginTile())) {
				movingToCity.getStatLine().addValue(Stat.FOOD_SURPLUS, 5);

				// Update city statline
				CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
				for (Stat stat : movingToCity.getStatLine().getStatValues().keySet()) {
					statUpdatePacket.addStat(movingToCity.getName(), stat.name(),
							movingToCity.getStatLine().getStatValues().get(stat).getValue());
				}

				movingToCity.getPlayerOwner().getConn().send(json.toJson(statUpdatePacket));

				movingToCity.getPlayerOwner().getStatLine().addValue(Stat.GOLD, 5);
				movingToCity.getPlayerOwner().updateOwnedStatlines(false);
			}
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}

		public void setTradingCity(City tradingCity) {
			this.tradingCity = tradingCity;
		}

		public void setCityHeadquarters(City cityHeadquarters) {
			this.cityHeadquarters = cityHeadquarters;
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(AnimalHusbandryTech.class);
	}

	@Override
	public String getName() {
		return "Caravan";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
