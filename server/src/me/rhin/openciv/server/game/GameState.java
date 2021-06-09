package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.GameMap;

public abstract class GameState {

	protected ArrayList<Player> players;
	protected GameMap map;

	public GameState() {
		players = Server.getInstance().getPlayers();
		map = Server.getInstance().getMap();
	}

	public Player getPlayerByConn(WebSocket conn) {
		return Server.getInstance().getPlayerByConn(conn);
	}

	public abstract void onStateEnd();

	public abstract void stop();
	
	public abstract String toString();
}
