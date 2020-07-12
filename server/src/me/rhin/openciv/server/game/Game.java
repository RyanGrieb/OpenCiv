package me.rhin.openciv.server.game;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.type.Palace;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
import me.rhin.openciv.server.listener.ConnectionListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.FetchPlayerListener;
import me.rhin.openciv.server.listener.PlayerFinishLoadingListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.server.listener.SelectUnitListener;
import me.rhin.openciv.server.listener.SetProductionItemListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.server.listener.StartGameRequestListener;
import me.rhin.openciv.server.listener.TurnTimeUpdateListener;
import me.rhin.openciv.server.listener.UnitMoveListener;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.TurnTimeUpdatePacket;
import me.rhin.openciv.shared.util.ColorHelper;

public class Game implements StartGameRequestListener, ConnectionListener, DisconnectListener,
		PlayerListRequestListener, FetchPlayerListener, SelectUnitListener, UnitMoveListener, SettleCityListener,
		PlayerFinishLoadingListener, TurnTimeUpdateListener, SetProductionItemListener {

	private static final int BASE_TURN_TIME = 9;

	private GameMap map;
	private ArrayList<Player> players;
	private ColorHelper colorHelper;
	private boolean started;
	private int turnTime;
	private long lastTurnClock;
	private ScheduledExecutorService executor;
	private Runnable turnTimeRunnable;

	public Game() {
		this.map = new GameMap(this);
		this.players = new ArrayList<>();
		this.colorHelper = new ColorHelper();
		this.started = false;
		this.turnTime = BASE_TURN_TIME;

		this.executor = Executors.newScheduledThreadPool(1);

		this.turnTimeRunnable = new Runnable() {
			public void run() {
				try {
					if (!playersLoaded() || !started)
						return;

					if ((System.currentTimeMillis() - lastTurnClock) / 1000 < turnTime)
						return;

					turnTime = getUpdatedTurnTime();
					Server.getInstance().getEventManager().fireEvent(new TurnTimeUpdateEvent(turnTime));
					lastTurnClock = System.currentTimeMillis();
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		};
		executor.scheduleAtFixedRate(turnTimeRunnable, 0, 1, TimeUnit.MILLISECONDS);

		Server.getInstance().getEventManager().addListener(StartGameRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(ConnectionListener.class, this);
		Server.getInstance().getEventManager().addListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(SelectUnitListener.class, this);
		Server.getInstance().getEventManager().addListener(UnitMoveListener.class, this);
		Server.getInstance().getEventManager().addListener(SettleCityListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerFinishLoadingListener.class, this);
		Server.getInstance().getEventManager().addListener(TurnTimeUpdateListener.class, this);
		Server.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
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
			packet.setColor(newPlayer.getColor().toString());
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

		Server.getInstance().getEventManager().removeListener(TurnTimeUpdateListener.class, removedPlayer);
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
			packet.addPlayer(player.getName(), player.getColor().toString());
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
		Unit unit = map.getTiles()[packet.getGridX()][packet.getGridY()].getUnitFromID(packet.getUnitID());
		if (unit == null)
			return;
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
	public void onSettleCity(WebSocket conn, SettleCityPacket settleCityPacket) {
		Player cityPlayer = getPlayerByConn(conn);
		settleCityPacket.setOwner(cityPlayer.getName());

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
		settleCityPacket.setCityName(cityName);

		Tile tile = map.getTiles()[settleCityPacket.getGridX()][settleCityPacket.getGridY()];
		Unit unit = null;

		for (Unit currentUnit : tile.getUnits())
			if (currentUnit instanceof SettlerUnit)
				unit = currentUnit;

		// The player is actually trying to hack if this is triggered
		if (unit == null)
			return;

		City city = new City(cityPlayer, cityName, tile);
		cityPlayer.addCity(city);
		cityPlayer.setSelectedUnit(null);

		DeleteUnitPacket deleteUnitPacket = new DeleteUnitPacket();
		deleteUnitPacket.setUnit(cityPlayer.getName(), unit.getID(), settleCityPacket.getGridX(),
				settleCityPacket.getGridY());

		Json json = new Json();
		for (Player player : players) {
			player.getConn().send(json.toJson(deleteUnitPacket));
			player.getConn().send(json.toJson(settleCityPacket));

			for (Tile territoryTile : city.getTerritory()) {
				TerritoryGrowPacket territoryGrowPacket = new TerritoryGrowPacket();
				territoryGrowPacket.setCityName(city.getName());
				territoryGrowPacket.setLocation(territoryTile.getGridX(), territoryTile.getGridY());
				territoryGrowPacket.setOwner(city.getPlayerOwner().getName());
				player.getConn().send(json.toJson(territoryGrowPacket));
			}
		}

		city.addBuilding(new Palace(city));
	}

	@Override
	public void onPlayerFinishLoading(WebSocket conn) {
		getPlayerByConn(conn).finishLoading();
	}

	@Override
	public void onTurnTimeUpdate(int turnTime) {
		Json json = new Json();
		TurnTimeUpdatePacket turnTimeUpdatePacket = new TurnTimeUpdatePacket();
		turnTimeUpdatePacket.setTurnTime(turnTime);
		for (Player player : players) {
			player.getConn().send(json.toJson(turnTimeUpdatePacket));
		}
	}

	@Override
	public void onSetProductionItem(WebSocket conn, SetProductionItemPacket packet) {
		// Verify if the player owns that city.
		Player player = getPlayerByConn(conn);
		City targetCity = null;
		for (City city : player.getOwnedCities())
			if (city.getName().equals(packet.getCityName()))
				targetCity = city;

		// TODO: Verify if the item can be produced.

		if (targetCity == null)
			return;

		targetCity.getProducibleItemManager().setProducingItem(packet.getItemName());

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void start() {
		System.out.println("[SERVER] Starting game...");
		map.generateTerrain();

		// Start the game
		Json json = new Json();
		GameStartPacket gameStartPacket = new GameStartPacket();
		for (Player player : players) {
			player.getConn().send(json.toJson(gameStartPacket));
		}

		Random rnd = new Random();

		for (int i = 0; i < players.size(); i++) {
			Player player = players.get(i);
			Rectangle rect = map.getMapPartition().get(i);

			int rndX = -1;
			int rndY = -1;
			while (true) {
				float padding = 0.25F;
				int minX = (int) (rect.getX() + (rect.getWidth() * padding));
				int minY = (int) (rect.getY() + (rect.getHeight() * padding));
				int maxX = (int) (rect.getX() + rect.getWidth() - (rect.getWidth() * padding));
				int maxY = (int) (rect.getY() + rect.getHeight() - (rect.getWidth() * padding));
				rndX = rnd.nextInt(maxX - minX + 1) + minX;
				rndY = rnd.nextInt(maxY - minY + 1) + minY;
				Tile tile = map.getTiles()[rndX][rndY];

				if (tile.getTileType() == TileType.OCEAN || tile.getTileType() == TileType.MOUNTAIN)
					continue;

				// Check if there is room for 2 units.
				boolean hasSafeTile = false;
				for (Tile adjTile : tile.getAdjTiles())
					if (adjTile.getTileType() != TileType.OCEAN && adjTile.getTileType() != TileType.MOUNTAIN)
						hasSafeTile = true;

				if (hasSafeTile) {
					player.setSpawnPos(rndX, rndY);
					break;
				}
			}
		}

		// Spawn in the players at fair locations

		for (Player player : players) {
			Tile tile = map.getTiles()[player.getSpawnX()][player.getSpawnY()];
			tile.addUnit(new SettlerUnit(player, tile));

			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile.getTileType() != TileType.OCEAN && adjTile.getTileType() != TileType.MOUNTAIN) {
					adjTile.addUnit(new WarriorUnit(player, adjTile));
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

	public int getTurnTime() {
		return turnTime;
	}

	private Player getPlayerByConn(WebSocket conn) {
		for (Player player : players)
			if (player.getConn().equals(conn))
				return player;

		return null;
	}

	private int getUpdatedTurnTime() {
		int cityMultiplier = 1;
		int unitMultiplier = 1;
		return BASE_TURN_TIME + getMaxPlayerCities() * cityMultiplier + getMaxPlayerUnits() * unitMultiplier;
	}

	private int getMaxPlayerCities() {
		int maxCities = 0;
		for (Player player : players)
			if (player.getOwnedCities().size() > maxCities)
				maxCities = player.getOwnedCities().size();
		return maxCities;
	}

	private int getMaxPlayerUnits() {
		int maxUnits = 0;
		for (Player player : players)
			if (player.getOwnedUnits().size() > maxUnits)
				maxUnits = player.getOwnedUnits().size();
		return maxUnits;
	}

	private boolean playersLoaded() {
		for (Player player : players)
			if (!player.isLoaded())
				return false;

		return true;
	}

	public ColorHelper getColorHelper() {
		return colorHelper;
	}
}
