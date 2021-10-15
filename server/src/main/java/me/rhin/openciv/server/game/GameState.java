package me.rhin.openciv.server.game;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.type.BarbarianPlayer;
import me.rhin.openciv.server.game.city.wonders.GameWonders;
import me.rhin.openciv.server.game.map.GameMap;

public abstract class GameState {

	protected ArrayList<Player> players;
	protected ArrayList<AIPlayer> aiPlayers;
	protected GameMap map;

	public GameState() {
		players = Server.getInstance().getPlayers();
		aiPlayers = Server.getInstance().getAIPlayers();
		map = Server.getInstance().getMap();
	}

	public BarbarianPlayer getBarbarianPlayer() {
		for (AIPlayer aiPlayer : aiPlayers)
			if (aiPlayer instanceof BarbarianPlayer)
				return (BarbarianPlayer) aiPlayer;

		return null;
	}

	public ArrayList<AIPlayer> getAIPlayers() {
		return aiPlayers;
	}

	public Player getPlayerByConn(WebSocket conn) {
		return Server.getInstance().getPlayerByConn(conn);
	}

	public abstract void onStateBegin();

	public abstract void onStateEnd();

	public abstract void stop();

	public abstract String toString();

	// FIXME: InGame only method
	public abstract GameWonders getWonders();
}
