package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.listener.ConnectionListener;

public class Game implements ConnectionListener {

	private ArrayList<Player> players;
	private boolean started;

	public Game() {
		this.players = new ArrayList<>();
		this.started = false;
	}

	@Override
	public void onConnection(WebSocket conn) {
		// FIXME: Check for multiple connections
		players.add(new Player(conn));
	}

}
