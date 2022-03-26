package me.rhin.openciv.server.game;

import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.AIType;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.civilization.CivType;
import me.rhin.openciv.server.game.diplomacy.Diplomacy;
import me.rhin.openciv.server.game.heritage.HeritageTree;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;

public abstract class AbstractPlayer implements NextTurnListener {

	protected ArrayList<City> ownedCities;
	protected ArrayList<Unit> ownedUnits;
	protected Diplomacy diplomacy;
	protected StatLine statLine;
	protected ResearchTree researchTree;
	protected HeritageTree heritageTree;
	protected PlayerReligion playerReligion;
	protected Civ civilization;
	private int spawnX;
	private int spawnY;

	public AbstractPlayer() {

		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();

		this.diplomacy = new Diplomacy(this);
		this.statLine = new StatLine();

		this.researchTree = new ResearchTree(this);
		this.heritageTree = new HeritageTree(this);
		this.playerReligion = new PlayerReligion(this);

		this.spawnX = -1;
		this.spawnY = -1;

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	public abstract String getName();

	public abstract void sendPacket(String json);

	public abstract boolean hasConnection();

	public abstract void setSelectedUnit(Unit unit);

	public abstract void sendNotification(String iconName, String text);

	@Override
	public void onNextTurn() {
		if (ownedCities.size() < 1)
			return;

		updateOwnedStatlines(true);
	}

	public void updateOwnedStatlines(boolean increaseValues) {

		// Clear previous values other than accumulative ones.
		statLine.clearNonAccumulative();

		if (ownedCities.size() > 0)
			for (Unit unit : ownedUnits) {
				statLine.mergeStatLine(unit.getMaintenance());
			}

		for (City city : ownedCities) {
			statLine.mergeStatLineExcluding(city.getStatLine(), StatType.CITY_EXCLUSIVE);
		}

		statLine.mergeStatLine(playerReligion.getStatLine());

		if (increaseValues)
			statLine.updateStatLine();

	}

	public void reduceStatLine(StatLine statLine) {
		this.statLine.reduceStatLine(statLine);
	}

	public void addOwnedUnit(Unit unit) {
		ownedUnits.add(unit);
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}

	public void addCity(City city) {
		ownedCities.add(city);
	}

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public HeritageTree getHeritageTree() {
		return heritageTree;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public boolean hasBuilt(Class<? extends Building> buildingClass) {
		for (City city : ownedCities) {
			for (Building building : city.getBuildings()) {
				if (building.getClass() == buildingClass)
					return true;
			}
		}

		return false;
	}

	public ArrayList<City> getOwnedCities() {
		return ownedCities;
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public City getCapitalCity() {
		return ownedCities.get(0);
	}

	public Civ getCiv() {
		return civilization;
	}

	public void setCivilization(Civ civilization) {
		this.civilization = civilization;
	}

	public void setCivilization(CivType civType) {
		this.civilization = civType.getCiv(this);
	}

	public void removeUnit(Unit unit) {
		ownedUnits.remove(unit);
	}

	public ArrayList<Unit> getUnitsOfType(Class<? extends Unit> unitClass) {
		ArrayList<Unit> units = new ArrayList<>();
		for (Unit unit : ownedUnits) {
			if (unit.getClass() == unitClass) {
				units.add(unit);
			}
		}

		return units;
	}

	public void setSpawnPos(int spawnX, int spawnY) {
		this.spawnX = spawnX;
		this.spawnY = spawnY;
	}

	public boolean hasSpawnPos() {
		return spawnX != -1 && spawnY != -1;
	}

	public int getSpawnX() {
		return spawnX;
	}

	public int getSpawnY() {
		return spawnY;
	}

	public boolean canCaptureUnit(Unit unit) {
		return civilization.canCaptureUnit(unit);
	}

	public Diplomacy getDiplomacy() {
		return diplomacy;
	}

	public PlayerReligion getReligion() {

		return playerReligion;
	}

	public boolean hasUnitOfType(Class<? extends Unit> unitClass) {
		for (Unit unit : ownedUnits) {
			if (unit.getClass() == unitClass)
				return true;
		}
		return false;
	}

	public abstract boolean isLoaded();

	public ArrayList<Tile> getObservedTiles() {
		ArrayList<Tile> tiles = new ArrayList<>();

		for (City city : ownedCities)
			tiles.addAll(city.getObservedTiles());
		for (Unit unit : ownedUnits)
			tiles.addAll(unit.getObservedTiles());

		return tiles;
	}

	public City getNearestCityToEnemy() {
		Random rnd = new Random();
		City nearestCity = null; // Nearest city by the enemy
		float distance = Integer.MAX_VALUE;

		ArrayList<City> enemyCities = new ArrayList<>();

		for (AbstractPlayer enemyPlayer : getDiplomacy().getEnemies()) {
			enemyCities.addAll(enemyPlayer.getOwnedCities());
		}

		for (City enemyCity : enemyCities) {
			for (City city : getOwnedCities()) {
				if (nearestCity == null || city.getTile().getDistanceFrom(enemyCity.getTile()) < distance) {
					distance = city.getTile().getDistanceFrom(enemyCity.getTile());
					nearestCity = city;
				}
			}
		}

		if (nearestCity == null && getOwnedCities().size() > 0) {
			nearestCity = getOwnedCities().get(rnd.nextInt(getOwnedCities().size()));
		}

		return nearestCity;
	}

	public float getTotalCombatStrength() {
		float totalCombatStrength = 0;
		for (Unit unit : ownedUnits) {
			totalCombatStrength += unit.getCombatStrength(null);
		}
		return totalCombatStrength;
	}

	public boolean isCityStatePlayer() {
		if (this instanceof AIPlayer) {
			AIPlayer aiPlayer = (AIPlayer) this;

			if (aiPlayer.getAIType() == AIType.CITY_STATE_PLAYER)
				return true;
		}
		return false;
	}

}
