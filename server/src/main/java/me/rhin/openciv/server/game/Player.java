package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.type.StatueOfAres;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.civilization.CivType;
import me.rhin.openciv.server.game.civilization.type.RandomCivilization;
import me.rhin.openciv.server.game.heritage.HeritageTree;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.server.listener.ChooseHeritageListener;
import me.rhin.openciv.server.listener.ChooseTechListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.TradeCityListener;
import me.rhin.openciv.shared.packet.type.ChooseHeritagePacket;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;

public class Player implements NextTurnListener, ChooseTechListener, ChooseHeritageListener, TradeCityListener {

	private WebSocket conn;
	private String name;
	private int spawnX;
	private int spawnY;
	private ArrayList<City> ownedCities;
	private ArrayList<Unit> ownedUnits;
	private Unit selectedUnit;
	private boolean loaded;
	private StatLine statLine;
	private Civ civilization;
	private boolean host;
	private ResearchTree researchTree;
	private HeritageTree heritageTree;
	private boolean turnDone;
	private int caravanAmount;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();
		this.civilization = new RandomCivilization(this);

		this.spawnX = -1;
		this.spawnY = -1;
		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.loaded = false;
		this.statLine = new StatLine();

		this.host = false;
		this.researchTree = new ResearchTree(this);
		this.heritageTree = new HeritageTree(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ChooseTechListener.class, this);
		Server.getInstance().getEventManager().addListener(ChooseHeritageListener.class, this);
		Server.getInstance().getEventManager().addListener(TradeCityListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (ownedCities.size() < 1)
			return;

		updateOwnedStatlines(true);
	}

	// FIXME: Move to researchTree
	@Override
	public void onChooseTech(WebSocket conn, ChooseTechPacket packet) {
		if (!conn.equals(this.conn))
			return;

		// FIXME: Check if the player is able to research that tech. (Prevent cheating).
		researchTree.chooseTech(packet.getTechID());
	}

	@Override
	public void onChooseHeritage(WebSocket conn, ChooseHeritagePacket packet) {
		if (!conn.equals(this.conn))
			return;

		heritageTree.studyHeritage(packet.getName());
	}

	@Override
	public void onTradeCity(WebSocket conn, TradeCityPacket packet) {
		if (!conn.equals(this.conn))
			return;

		Unit unit = Server.getInstance().getMap().getTiles()[packet.getUnitGridX()][packet.getUnitGridY()]
				.getUnitFromID(packet.getUnitID());

		City city = null;

		for (Player player : Server.getInstance().getPlayers())
			for (City playerCity : player.getOwnedCities())
				if (playerCity.getName().equals(packet.getCityName())) {
					city = playerCity;
				}

		if (!(unit instanceof CaravanUnit) || city == null)
			return;

		System.out.println("Attempting to trade w/ city: " + city.getName());
		CaravanUnit caravanUnit = (CaravanUnit) unit;
		caravanUnit.setTradingCity(city);
		caravanUnit.setCityHeadquarters(unit.getStandingTile().getCity());
	}

	public void updateOwnedStatlines(boolean increaseValues) {

		statLine.clearNonAccumulative();

		for (City city : ownedCities) {
			statLine.mergeStatLineExcluding(city.getStatLine(), StatType.CITY_EXCLUSIVE);
		}

		if (increaseValues)
			statLine.updateStatLine();

		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : statLine.getStatValues().keySet()) {
			if (stat.getStatType() != StatType.CITY_EXCLUSIVE)
				packet.addStat(stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void mergeStatLine(StatLine statLine) {
		this.statLine.mergeStatLine(statLine);
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void reduceStatLine(StatLine statLine) {
		this.statLine.reduceStatLine(statLine);
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void setSpawnPos(int spawnX, int spawnY) {
		this.spawnX = spawnX;
		this.spawnY = spawnY;
	}

	public boolean hasSpawnPos() {
		return spawnX != -1 && spawnY != -1;
	}

	public void setSelectedUnit(Unit selectedUnit) {
		if (this.selectedUnit != null)
			this.selectedUnit.setSelected(false);
		this.selectedUnit = selectedUnit;
	}

	public WebSocket getConn() {
		return conn;
	}

	public String getName() {
		return name;
	}

	public int getSpawnX() {
		return spawnX;
	}

	public int getSpawnY() {
		return spawnY;
	}

	public boolean hasSpawnSet() {
		return spawnX == -1 || spawnY == -1;
	}

	public ArrayList<City> getOwnedCities() {
		return ownedCities;
	}

	public void addCity(City city) {
		ownedCities.add(city);
	}

	public void addOwnedUnit(Unit unit) {
		ownedUnits.add(unit);
	}

	public void setCivilization(CivType civType) {
		this.civilization = civType.getCiv(this);
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public void finishLoading() {
		this.loaded = true;

		heritageTree.initHeritage();
		civilization.initHeritage();
	}

	public boolean isLoaded() {
		return loaded;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public void setHost() {
		this.host = true;
	}

	public boolean isHost() {
		return host;
	}

	public Civ getCiv() {
		return civilization;
	}

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}

	public void setTurnDone(boolean turnDone) {
		this.turnDone = turnDone;
	}

	public boolean isTurnDone() {
		return turnDone;
	}

	public HeritageTree getHeritageTree() {
		return heritageTree;
	}

	public City getCapitalCity() {
		return ownedCities.get(0);
	}

	public boolean hasBuilt(Class<StatueOfAres> buildingClass) {
		for (City city : ownedCities) {
			for (Building building : city.getBuildings()) {
				if (building.getClass() == buildingClass)
					return true;
			}
		}

		return false;
	}

	public int getCaravanAmount() {
		return caravanAmount;
	}

	public void setCaravanAmount(int caravanAmount) {
		this.caravanAmount = caravanAmount;
	}
}
