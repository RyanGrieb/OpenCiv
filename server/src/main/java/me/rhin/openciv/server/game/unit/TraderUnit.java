package me.rhin.openciv.server.game.unit;

import java.util.ArrayList;
import java.util.Arrays;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.stat.Stat;

public abstract class TraderUnit extends Unit {

	private City tradingCity;
	private City cityHeadquarters;
	private City movingToCity;
	private float goldValue, foodValue;

	public TraderUnit(AbstractPlayer playerOwner, Tile standingTile, float goldValue, float foodValue) {
		super(playerOwner, standingTile);

		this.goldValue = goldValue;
		this.foodValue = foodValue;

		combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		playerOwner.getStatLine().addValue(Stat.TRADE_ROUTE_AMOUNT, 1);
		playerOwner.updateOwnedStatlines(false);
	}

	@Override
	public void onNextTurn() {
		trade();
	}

	@Override
	protected void onKill(ArrayList<DeleteUnitOptions> optionList) {
		super.onKill(optionList);

		getPlayerOwner().getStatLine().subValue(Stat.TRADE_ROUTE_AMOUNT, 1);
		getPlayerOwner().updateOwnedStatlines(false);
	}

	public void setTradingCity(City tradingCity) {
		this.tradingCity = tradingCity;
	}

	public void setCityHeadquarters(City cityHeadquarters) {
		this.cityHeadquarters = cityHeadquarters;
	}

	public void trade() {
		if (!isAlive())
			return;

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
		// Parent tile is null, why.
		if (parentTile == null) {
			System.out.println("Invalid path");
			return;
		}

		Tile stepTile = null;

		int iterations = 0;
		float pathMovement = 0;
		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile == null)
				nextTile = targetTile;

			for (Tile adjTile : nextTile.getAdjTiles()) {
				if (adjTile == null)
					continue;
				if (adjTile.equals(standingTile)) {
					stepTile = nextTile;
					break;
				}
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
			player.sendPacket(json.toJson(packet));

		this.moveToTargetTile();

		if (stepTile.equals(movingToCity.getOriginTile())) {
			movingToCity.getStatLine().addValue(Stat.FOOD_SURPLUS, foodValue);

			// Update city statline
			CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
			for (Stat stat : movingToCity.getStatLine().getStatValues().keySet()) {
				statUpdatePacket.addStat(movingToCity.getName(), stat.name(),
						movingToCity.getStatLine().getStatValues().get(stat).getValue());
			}

			movingToCity.getPlayerOwner().sendPacket(json.toJson(statUpdatePacket));

			float goldAmount = goldValue * (1 + movingToCity.getStatLine().getStatModifier(Stat.TRADE_GOLD_MODIFIER));

			movingToCity.getPlayerOwner().getStatLine().addValue(Stat.GOLD, goldAmount);
			movingToCity.getPlayerOwner().updateOwnedStatlines(false);
		}
	}

}
