package me.rhin.openciv.server.game;

import java.sql.Connection;

import org.java_websocket.WebSocket;

public class Player {

	private WebSocket conn;

	public Player(WebSocket conn) {
		this.conn = conn;
	}

	public WebSocket getConn() {
		return conn;
	}

}
