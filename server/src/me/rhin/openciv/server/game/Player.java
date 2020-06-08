package me.rhin.openciv.server.game;

import java.sql.Connection;

import org.java_websocket.WebSocket;

public class Player {

	private WebSocket conn;
	private String name;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player";
	}

	public WebSocket getConn() {
		return conn;
	}

	public String getName() {

		return name;

	}

}
