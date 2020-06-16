package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.unit.Unit;

public class Player {

	private WebSocket conn;
	private String name;
	private int spawnX;
	private int spawnY;
	private ArrayList<City> ownedCities;
	private Unit selectedUnit;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();

		this.spawnX = -1;
		this.spawnY = -1;
		this.ownedCities = new ArrayList<>();
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
}
