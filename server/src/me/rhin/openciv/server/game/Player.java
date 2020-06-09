package me.rhin.openciv.server.game;

import java.sql.Connection;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;

public class Player {

	private WebSocket conn;
	private String name;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();
	}

	public WebSocket getConn() {
		return conn;
	}

	public String getName() {

		return name;

	}

}
