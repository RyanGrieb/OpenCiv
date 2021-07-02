package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.CivType;
import me.rhin.openciv.server.game.policy.PolicyManager;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.ChooseTechListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;

public class Player implements NextTurnListener, ChooseTechListener {

	private WebSocket conn;
	private String name;
	private int spawnX;
	private int spawnY;
	private ArrayList<City> ownedCities;
	private ArrayList<Unit> ownedUnits;
	private Unit selectedUnit;
	private boolean loaded;
	private StatLine statLine;
	private PolicyManager policyManager;
	private CivType civType;
	private boolean host;
	private ResearchTree researchTree;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();
		this.civType = CivType.RANDOM;

		this.spawnX = -1;
		this.spawnY = -1;
		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.loaded = false;
		this.statLine = new StatLine();

		policyManager = new PolicyManager(this);
		this.host = false;
		this.researchTree = new ResearchTree(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ChooseTechListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (ownedCities.size() < 1)
			return;

		statLine.updateStatLine();

		statLine.clearNonAccumulative();

		for (City city : ownedCities)
			statLine.mergeStatLineExcluding(city.getStatLine(), StatType.CITY_EXCLUSIVE);

		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : statLine.getStatValues().keySet()) {
			if (stat.getStatType() != StatType.CITY_EXCLUSIVE)
				packet.addStat(stat.name(), this.statLine.getStatValues().get(stat));
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onChooseTech(WebSocket conn, ChooseTechPacket packet) {
		if (!conn.equals(this.conn))
			return;

		researchTree.chooseTech(packet.getTechID());
	}

	public void mergeStatLine(StatLine statLine) {
		this.statLine.mergeStatLine(statLine);
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat));
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void reduceStatLine(StatLine statLine) {
		this.statLine.reduceStatLine(statLine);
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat));
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
		this.civType = civType;
	}

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public void finishLoading() {
		this.loaded = true;
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

	public CivType getCivType() {
		return civType;
	}

	public ResearchTree getResearchTree() {
		return researchTree;
	}

	public void removeCity(City city) {
		ownedCities.remove(city);
	}
}
