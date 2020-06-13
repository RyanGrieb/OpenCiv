package me.rhin.openciv.server.game;

import java.util.ArrayList;
import java.util.Random;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.map.Tile;
import me.rhin.openciv.server.game.map.tile.GameMap;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Settler;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.FetchPlayerListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.server.listener.SelectUnitListener;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.util.MathHelper;

public class Game implements ConnectionListener, DisconnectListener, PlayerListRequestListener, FetchPlayerListener,
		SelectUnitListener {

	private GameMap map;
	private ArrayList<Player> players;
	private boolean started;

	public Game() {
		this.map = new GameMap(this);
		this.players = new ArrayList<>();
		this.started = false;

		Server.getInstance().getEventManager().addListener(ConnectionListener.class, this);
		Server.getInstance().getEventManager().addListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(SelectUnitListener.class, this);
	}

	@Override
	public void onConnection(WebSocket conn) {
		// FIXME: Check for multiple connections

		Player newPlayer = new Player(conn);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerConnectPacket packet = new PlayerConnectPacket();
			packet.setPlayerName(newPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}

		players.add(newPlayer);
	}

	@Override
	public void onDisconnect(WebSocket conn) {
		Player removedPlayer = getPlayerByConn(conn);

		if (removedPlayer == null)
			return;

		players.remove(removedPlayer);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}
	}

	@Override
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		System.out.println("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onPlayerFetch(WebSocket conn, FetchPlayerPacket packet) {
		System.out.println("[SERVER] Fetching player...");
		Player player = getPlayerByConn(conn);
		packet.setPlayerName(player.getName());
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onUnitSelect(WebSocket conn, SelectUnitPacket packet) {
		// FIXME: Use a hashmap to get by unit name?
		Unit unit = map.getTiles()[packet.getGridX()][packet.getGridY()].getUnits().get(0);
		Player player = getPlayerByConn(conn);
		if (!unit.getPlayerOwner().equals(player))
			return;

		player.setSelectedUnit(unit);

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void start() {
		System.out.println("[SERVER] Starting game...");
		map.generateTerrain();

		// Start the game
		for (Player player : players) {
			Json json = new Json();
			GameStartPacket packet = new GameStartPacket();
			player.getConn().send(json.toJson(packet));
		}

		// Spawn in the players at fair locations

		Random rnd = new Random();

		for (Player player : players) {
			int rndX = -1;
			int rndY = -1;
			while (true) {
				rndX = rnd.nextInt(GameMap.WIDTH);
				rndY = rnd.nextInt(GameMap.HEIGHT);
				Tile tile = map.getTiles()[rndX][rndY];

				if (tile.getTileType().equals(TileType.OCEAN) || tile.getTileType().equals(TileType.MOUNTAIN))
					continue;

				float maxDistance = -1; // Closest distance to another player;
				for (Player otherPlayer : players) {
					if (player.equals(otherPlayer) || !player.hasSpawnSet())
						continue;

					float distance = MathHelper.distance(rndX, rndY, otherPlayer.getSpawnX(), otherPlayer.getSpawnY());
					if (distance > maxDistance)
						maxDistance = distance;
				}

				if (maxDistance > 20 || maxDistance == -1) {
					player.setSpawnPos(rndX, rndY);
					break;
				}
			}

		}

		for (Player player : players) {
			Tile tile = map.getTiles()[player.getSpawnX()][player.getSpawnY()];
			tile.addUnit(new Settler(player, tile));
		}

		started = true;
	}

	public void stop() {
		System.out.println("[SERVER] Stopping game...");
		started = false;
	}

	public ArrayList<Player> getPlayers() {
		return players;
	}

	private Player getPlayerByConn(WebSocket conn) {

		for (Player player : players)
			if (player.getConn().equals(conn))
				return player;

		return null;
	}
}
