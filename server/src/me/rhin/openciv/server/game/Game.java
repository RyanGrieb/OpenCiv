package me.rhin.openciv.server.game;

import java.util.ArrayList;
import java.util.Random;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Settler;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.Warrior;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.FetchPlayerListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.server.listener.SelectUnitListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.server.listener.StartGameRequestListener;
import me.rhin.openciv.server.listener.UnitMoveListener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.util.MathHelper;

public class Game implements StartGameRequestListener, ConnectionListener, DisconnectListener,
		PlayerListRequestListener, FetchPlayerListener, SelectUnitListener, UnitMoveListener, SettleCityListener {

	private GameMap map;
	private ArrayList<Player> players;
	private boolean started;

	public Game() {
		this.map = new GameMap(this);
		this.players = new ArrayList<>();
		this.started = false;

		Server.getInstance().getEventManager().addListener(StartGameRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(ConnectionListener.class, this);
		Server.getInstance().getEventManager().addListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(SelectUnitListener.class, this);
		Server.getInstance().getEventManager().addListener(UnitMoveListener.class, this);
		Server.getInstance().getEventManager().addListener(SettleCityListener.class, this);
	}

	@Override
	public void onStartGameRequest(WebSocket conn) {
		if (conn != null && !getPlayerByConn(conn).equals(players.get(0)))
			return;
		start();
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
		unit.setSelected(true);

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onUnitMove(WebSocket conn, MoveUnitPacket packet) {

		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];

		Unit unit = prevTile.getUnitFromID(packet.getUnitID());

		if (unit == null) {
			System.out.println("Error: Unit is NULL");
			return;
		}

		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];

		unit.setTargetTile(targetTile);

		// The player is hacking here or i'm a poop coder
		if (unit.getCurrentMovement() < unit.getPathMovement())
			return;

		unit.moveToTargetTile();
		unit.getPlayerOwner().setSelectedUnit(null);
		unit.reduceMovement(packet.getMovementCost());

		packet.setMovementCost(unit.getPathMovement());

		Json json = new Json();
		for (Player player : players) {
			player.getConn().send(json.toJson(packet));
		}
	}

	@Override
	public void onSettleCity(WebSocket conn, SettleCityPacket packet) {
		Player cityPlayer = getPlayerByConn(conn);
		packet.setOwner(cityPlayer.getName());

		String cityName = "Unknown";
		boolean identicalName = true;

		while (identicalName) {
			identicalName = false;
			cityName = City.getRandomCityName();
			for (Player player : players) {
				for (City city : player.getOwnedCities()) {
					if (city.getName().equals(cityName))
						identicalName = true;
				}
			}
		}
		packet.setCityName(cityName);

		City city = new City(cityPlayer, cityName);
		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		tile.setCity(city);
		cityPlayer.addCity(city);

		cityPlayer.setSelectedUnit(null);
		Unit unit = tile.getUnits().remove(0);

		DeleteUnitPacket deleteUnitPacket = new DeleteUnitPacket();
		deleteUnitPacket.setUnit(cityPlayer.getName(), unit.getID(), packet.getGridX(), packet.getGridY());
		Json json = new Json();
		for (Player player : players) {
			player.getConn().send(json.toJson(deleteUnitPacket));
			player.getConn().send(json.toJson(packet));
		}
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

				// Check if there is room for 2 units.
				boolean hasSafeTile = false;
				for (Tile adjTile : tile.getAdjTiles())
					if (adjTile.getTileType() != TileType.OCEAN)
						hasSafeTile = true;

				if (maxDistance > 20 || maxDistance == -1 && hasSafeTile) {
					player.setSpawnPos(rndX, rndY);
					break;
				}
			}

		}

		for (Player player : players) {
			Tile tile = map.getTiles()[player.getSpawnX()][player.getSpawnY()];
			tile.addUnit(new Settler(player, tile));

			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile.getTileType() != TileType.OCEAN) {
					adjTile.addUnit(new Warrior(player, adjTile));
					break;
				}
			}
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
