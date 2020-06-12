package me.rhin.openciv.server.game;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.Vector2;

import me.rhin.openciv.server.Server;

public class Player {

	private WebSocket conn;
	private String name;
	private int spawnX;
	private int spawnY;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();

		this.spawnX = -1;
		this.spawnY = -1;
	}

	public WebSocket getConn() {
		return conn;
	}

	public String getName() {
		return name;
	}

	public void setSpawnPos(int spawnX, int spawnY) {
		this.spawnX = spawnX;
		this.spawnY = spawnY;
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
}
