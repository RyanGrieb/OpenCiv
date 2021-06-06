package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.policy.PolicyManager;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Player implements NextTurnListener {

	private WebSocket conn;
	private String name;
	private int spawnX;
	private int spawnY;
	private ArrayList<City> ownedCities;
	private ArrayList<Unit> ownedUnits;
	private Unit selectedUnit;
	private boolean loaded;
	private Color color;
	private StatLine statLine;
	private PolicyManager policyManager;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();

		this.spawnX = -1;
		this.spawnY = -1;
		this.ownedCities = new ArrayList<>();
		this.ownedUnits = new ArrayList<>();
		this.loaded = false;
		this.color = Server.getInstance().getColorHelper().getRandomColor();
		this.statLine = new StatLine();

		policyManager = new PolicyManager(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (ownedCities.size() < 1)
			return;

		try {
			statLine.updateStatLine();
		} catch (Exception e) {
			e.printStackTrace();
		}

		// FIXME: We should have a universal method for this, dunno where to put it.
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat));
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	// FIXME: Find a better name that isn't the same as the statline class method.
	public void mergeStatLine(StatLine statLine) {
		this.statLine.mergeStatLine(statLine);

		// FIXME: We should have a universal method for this, dunno where to put it.
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

	public ArrayList<Unit> getOwnedUnits() {
		return ownedUnits;
	}

	public void finishLoading() {
		this.loaded = true;
	}

	public boolean isLoaded() {
		return loaded;
	}

	public Color getColor() {
		return color;
	}

	public StatLine getStatLine() {
		return statLine;
	}
}
