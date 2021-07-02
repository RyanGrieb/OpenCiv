package me.rhin.openciv.server.game.state;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.type.Palace;
import me.rhin.openciv.server.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
import me.rhin.openciv.server.game.unit.type.WorkBoat.WorkBoatUnit;
import me.rhin.openciv.server.listener.ClickSpecialistListener;
import me.rhin.openciv.server.listener.ClickWorkedTileListener;
import me.rhin.openciv.server.listener.CombatPreviewListener;
import me.rhin.openciv.server.listener.DisconnectListener;
import me.rhin.openciv.server.listener.EndTurnListener;
import me.rhin.openciv.server.listener.FetchPlayerListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.PlayerFinishLoadingListener;
import me.rhin.openciv.server.listener.PlayerListRequestListener;
import me.rhin.openciv.server.listener.RangedAttackListener;
import me.rhin.openciv.server.listener.SelectUnitListener;
import me.rhin.openciv.server.listener.SetProductionItemListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.server.listener.UnitMoveListener;
import me.rhin.openciv.server.listener.WorkTileListener;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.CombatPreviewPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.EndTurnPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.GameStartPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.PlayerDisconnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.stat.Stat;

//FIXME: Instead of the civ game listening for everything. Just split them off into the respective classes. (EX: CombatPreviewListener in the Unit class)
//Or just use reflection so we don't have to implement 20+ classes.
public class InGameState extends GameState implements DisconnectListener, SelectUnitListener, UnitMoveListener,
		SettleCityListener, PlayerFinishLoadingListener, NextTurnListener, SetProductionItemListener,
		ClickWorkedTileListener, ClickSpecialistListener, EndTurnListener, PlayerListRequestListener,
		FetchPlayerListener, CombatPreviewListener, WorkTileListener, RangedAttackListener {

	private static final int BASE_TURN_TIME = 9;

	private int currentTurn;
	private int turnTimeLeft;
	private ScheduledExecutorService executor;
	private Runnable turnTimeRunnable;

	public InGameState() {

		Server.getInstance().getEventManager().addListener(DisconnectListener.class, this);
		Server.getInstance().getEventManager().addListener(SelectUnitListener.class, this);
		Server.getInstance().getEventManager().addListener(UnitMoveListener.class, this);
		Server.getInstance().getEventManager().addListener(SettleCityListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerFinishLoadingListener.class, this);
		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
		Server.getInstance().getEventManager().addListener(ClickWorkedTileListener.class, this);
		Server.getInstance().getEventManager().addListener(ClickSpecialistListener.class, this);
		Server.getInstance().getEventManager().addListener(EndTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Server.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Server.getInstance().getEventManager().addListener(CombatPreviewListener.class, this);
		Server.getInstance().getEventManager().addListener(WorkTileListener.class, this);
		Server.getInstance().getEventManager().addListener(RangedAttackListener.class, this);
	}

	@Override
	public void onStateBegin() {
		this.currentTurn = 0;
		this.turnTimeLeft = 0;

		this.executor = Executors.newScheduledThreadPool(1);

		this.turnTimeRunnable = new Runnable() {
			public void run() {
				try {
					if (!playersLoaded())
						return;
					if (turnTimeLeft <= 0) {
						Server.getInstance().getEventManager().fireEvent(new NextTurnEvent());
						currentTurn++;
						turnTimeLeft = getUpdatedTurnTime();
					}

					TurnTimeLeftPacket turnTimeLeftPacket = new TurnTimeLeftPacket();
					turnTimeLeftPacket.setTime(turnTimeLeft);

					Json json = new Json();
					for (Player player : players)
						player.getConn().send(json.toJson(turnTimeLeftPacket));

					turnTimeLeft--;

				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		};
		executor.scheduleAtFixedRate(turnTimeRunnable, 0, 1, TimeUnit.SECONDS);

		loadGame();
	}

	@Override
	public void onStateEnd() {
		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public void stop() {
		// Revert back to lobby state.
	}

	// TODO: On player connection, don't allow him to join yet. Since we haven't
	// implemented hot joining.

	@Override
	public void onDisconnect(WebSocket conn) {
		Player removedPlayer = getPlayerByConn(conn);

		if (removedPlayer == null)
			return;

		Server.getInstance().getEventManager().removeListener(NextTurnListener.class, removedPlayer);
		players.remove(removedPlayer);

		for (Player player : players) {
			WebSocket playerConn = player.getConn();

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			playerConn.send(json.toJson(packet));
		}

		if (players.size() < 1) {
			// TODO: Change State back to lobby. Or with popup window?
		}
	}

	// TODO: Move to map class
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

	// TODO: Move to map class
	@Override
	public void onUnitMove(WebSocket conn, MoveUnitPacket packet) {

		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];

		Unit unit = prevTile.getUnitFromID(packet.getUnitID());

		if (unit == null) {
			System.out.println("Error: Unit is NULL");
			return;
		}

		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Tile originalTargetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Json json = new Json();

		unit.setTargetTile(targetTile);

		// If were moving onto a unit or city. Stop the unit just outside the target
		// unit.
		if (targetTile.getAttackableEntity() != null)
			if (!targetTile.getAttackableEntity().getPlayerOwner().equals(unit.getPlayerOwner())
					&& (!targetTile.getAttackableEntity().isUnitCapturable()
							&& targetTile.getAttackableEntity().surviveAttack(unit))) {
				targetTile = unit.getCameFromTiles()[targetTile.getGridX()][targetTile.getGridY()];
				if (targetTile != null) {
					unit.setTargetTile(targetTile);
				} else // If the came from tile is null, assume it's where we are standing
					targetTile = unit.getStandingTile();
			}

		// Move to target tile
		if (unit.getMovement() >= unit.getPathMovement() && !unit.getStandingTile().equals(targetTile)) {

			unit.moveToTargetTile();
			unit.getPlayerOwner().setSelectedUnit(null);
			unit.reduceMovement(unit.getPathMovement());

			packet.setMovementCost(unit.getPathMovement());
			packet.setLocation(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

			for (Player player : players) {
				player.getConn().send(json.toJson(packet));
			}
		}

		// If the tile we are moving on has a capturable unit.
		if (targetTile.getCaptureableUnit() != null) {
			Unit targetUnit = targetTile.getCaptureableUnit();

			// Problem: Wrong id being set in the packet?
			targetUnit.setPlayerOwner(unit.getPlayerOwner());
			SetUnitOwnerPacket setOwnerPacket = new SetUnitOwnerPacket();
			setOwnerPacket.setUnit(targetUnit.getPlayerOwner().getName(), targetUnit.getID(),
					targetUnit.getStandingTile().getGridX(), targetUnit.getStandingTile().getGridY());

			for (Player player : players) {
				player.getConn().send(json.toJson(setOwnerPacket));
			}
		}

		// Handle the targetTile being a enemy unit.
		if (originalTargetTile.getAttackableEntity() != null)
			if (!originalTargetTile.getAttackableEntity().getPlayerOwner().equals(unit.getPlayerOwner())) {
				// We are about to attack this unit on the tile
				AttackableEntity targetEntity = originalTargetTile.getAttackableEntity();

				float unitDamage = unit.getDamageTaken(targetEntity);
				float targetDamage = targetEntity.getDamageTaken(unit);

				unit.setHealth(unit.getHealth() - unitDamage);
				targetEntity.setHealth(targetEntity.getHealth() - targetDamage);

				if (targetEntity.getHealth() > 0) {
					UnitAttackPacket attackPacket = new UnitAttackPacket();
					attackPacket.setUnitLocations(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY(),
							targetEntity.getTile().getGridX(), targetEntity.getTile().getGridY());
					attackPacket.setUnitDamage(unitDamage);
					attackPacket.setTargetDamage(targetDamage);

					for (Player player : players) {
						player.getConn().send(json.toJson(attackPacket));
					}
				}

				// Delete units below 1 hp

				// If target is unit, use this method. if city, implement that other one

				// Doesn't get called?

				if (targetEntity.getHealth() <= 0) {
					if (targetEntity instanceof Unit && targetEntity.getTile().getCity() == null) {

						Unit targetUnit = (Unit) targetEntity;
						targetUnit.getStandingTile().removeUnit(targetUnit);

						// FIXME: Redundant code.
						DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
						removeUnitPacket.setUnit(targetUnit.getID(), targetUnit.getStandingTile().getGridX(),
								targetUnit.getStandingTile().getGridY());

						for (Player player : players) {
							player.getConn().send(json.toJson(removeUnitPacket));
						}
					}

					// When we capture a city
					if (targetEntity instanceof City) {
						
						City city = (City) targetEntity;
						city.setHealth(city.getMaxHealth() / 2);

						//Reduce statline of the original owner
						city.getPlayerOwner().reduceStatLine(city.getStatLine());

						city.getPlayerOwner().removeCity(city);
						city.setOwner(unit.getPlayerOwner());
						unit.getPlayerOwner().addCity(city);

						SetCityOwnerPacket cityOwnerPacket = new SetCityOwnerPacket();
						cityOwnerPacket.setCity(city.getName(), unit.getPlayerOwner().getName());

						for (Player player : players) {
							player.getConn().send(json.toJson(cityOwnerPacket));
						}

						SetCityHealthPacket cityHealthPacket = new SetCityHealthPacket();
						cityHealthPacket.setCity(city.getName(), city.getMaxHealth() / 2);

						for (Player player : players) {
							player.getConn().send(json.toJson(cityHealthPacket));
						}

						city.getPlayerOwner().mergeStatLine(city.getStatLine());

						// Kill all enemy units inside the city
						for (Unit cityUnit : city.getTile().getUnits()) {
							if (!cityUnit.getPlayerOwner().equals(unit.getPlayerOwner())) {

								city.getTile().removeUnit(cityUnit);

								DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
								removeUnitPacket.setUnit(cityUnit.getID(), cityUnit.getStandingTile().getGridX(),
										cityUnit.getStandingTile().getGridY());

								for (Player player : players) {
									player.getConn().send(json.toJson(removeUnitPacket));
								}

							}
						}
					}
				}

				if (unit.getHealth() <= 0) {
					unit.getStandingTile().removeUnit(unit);

					DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
					removeUnitPacket.setUnit(unit.getID(), unit.getStandingTile().getGridX(),
							unit.getStandingTile().getGridY());

					for (Player player : players) {
						player.getConn().send(json.toJson(removeUnitPacket));
					}
				}

			}

	}

	// TODO: Move to game map class?
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

		tile.removeUnit(unit);

		DeleteUnitPacket deleteUnitPacket = new DeleteUnitPacket();
		deleteUnitPacket.setUnit(unit.getID(), settleCityPacket.getGridX(), settleCityPacket.getGridY());

		Json json = new Json();
		for (Player player : players) {
			player.getConn().send(json.toJson(deleteUnitPacket));
			player.getConn().send(json.toJson(settleCityPacket));

			for (Tile territoryTile : city.getTerritory()) {
				if (territoryTile == null)
					continue;
				TerritoryGrowPacket territoryGrowPacket = new TerritoryGrowPacket();
				territoryGrowPacket.setCityName(city.getName());
				territoryGrowPacket.setLocation(territoryTile.getGridX(), territoryTile.getGridY());
				territoryGrowPacket.setOwner(city.getPlayerOwner().getName());
				player.getConn().send(json.toJson(territoryGrowPacket));
			}
		}

		city.addBuilding(new Palace(city));
		city.updateWorkedTiles();
	}

	@Override
	public void onPlayerFinishLoading(WebSocket conn) {
		getPlayerByConn(conn).finishLoading();
	}

	@Override
	public void onNextTurn() {
		Json json = new Json();
		NextTurnPacket turnTimeUpdatePacket = new NextTurnPacket();
		turnTimeUpdatePacket.setTurnTime(getUpdatedTurnTime());
		for (Player player : players) {
			player.getConn().send(json.toJson(turnTimeUpdatePacket));
		}
	}

	// TODO: Move to city class
	@Override
	public void onSetProductionItem(WebSocket conn, SetProductionItemPacket packet) {
		// Verify if the player owns that city.
		Player player = getPlayerByConn(conn);
		City targetCity = null;
		for (City city : player.getOwnedCities()) {
			if (city.getName().equals(packet.getCityName()))
				targetCity = city;
		}

		// TODO: Verify if the item can be produced.

		if (targetCity == null)
			return;

		targetCity.getProducibleItemManager().setProducingItem(packet.getItemName());

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	// TODO: Move to city class
	@Override
	public void onClickWorkedTile(WebSocket conn, ClickWorkedTilePacket packet) {
		Player player = getPlayerByConn(conn);
		City targetCity = null;
		for (City city : player.getOwnedCities())
			if (city.getName().equals(packet.getCityName()))
				targetCity = city;

		if (targetCity == null)
			return;

		targetCity.clickWorkedTile(map.getTiles()[packet.getGridX()][packet.getGridY()]);
	}

	// TODO: Move to city class
	@Override
	public void onClickSpecialist(WebSocket conn, ClickSpecialistPacket packet) {
		// FIXME: This target city stuff is starting to seem redundant, lets fix that
		// soon.
		Player player = getPlayerByConn(conn);
		City targetCity = null;
		for (City city : player.getOwnedCities())
			if (city.getName().equals(packet.getCityName()))
				targetCity = city;

		if (targetCity == null)
			return;

		// FIXME: Should this be here or in the city class

		ArrayList<SpecialistContainer> specialistContainers = new ArrayList<>();
		specialistContainers.add(targetCity);

		for (Building building : targetCity.getBuildings())
			if (building instanceof SpecialistContainer)
				specialistContainers.add((SpecialistContainer) building);

		for (SpecialistContainer container : specialistContainers)
			if (container.getName().equals(packet.getContainerName()))
				targetCity.removeSpecialistFromContainer(container);
	}

	@Override
	public void onEndTurn(WebSocket conn, EndTurnPacket packet) {
		Server.getInstance().getEventManager().fireEvent(new NextTurnEvent());
		currentTurn++;
		turnTimeLeft = getUpdatedTurnTime();

		TurnTimeLeftPacket turnTimeLeftPacket = new TurnTimeLeftPacket();
		turnTimeLeftPacket.setTime(turnTimeLeft);

		Json json = new Json();
		for (Player player : players)
			player.getConn().send(json.toJson(turnTimeLeftPacket));
	}

	@Override
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		System.out.println("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName(), player.getCivType().name());
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

	// TODO: Split this up into the Unit class
	@Override
	public void onCombatPreview(WebSocket conn, CombatPreviewPacket packet) {
		AttackableEntity attackingEntity = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()]
				.getAttackableEntity();
		AttackableEntity targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
				.getAttackableEntity();

		if (attackingEntity instanceof RangedUnit) {
			packet.setUnitDamage(0);
		} else
			packet.setUnitDamage(attackingEntity.getDamageTaken(targetEntity));

		packet.setTargetDamage(targetEntity.getDamageTaken(attackingEntity));

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	@Override
	public void onRangedAttack(WebSocket conn, RangedAttackPacket packet) {
		// FIXME: I don't check unit ID's here
		AttackableEntity attackingEntity = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()]
				.getAttackableEntity();
		AttackableEntity targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
				.getAttackableEntity();

		if (attackingEntity instanceof Unit) {
			((Unit) attackingEntity).reduceMovement(2);
		}

		// FIXME: Slight redundant code w/ mele attack.
		if (!attackingEntity.getPlayerOwner().equals(targetEntity.getPlayerOwner())) {
			// We are about to attack this unit on the tile

			Json json = new Json();
			float unitDamage = attackingEntity.getDamageTaken(targetEntity);
			float targetDamage = targetEntity.getDamageTaken(attackingEntity);

			attackingEntity.setHealth(attackingEntity.getHealth() - unitDamage);
			targetEntity.setHealth(targetEntity.getHealth() - targetDamage);

			// If our ranged unit reduces the city below health, just set it to the min
			// amount.
			if (targetEntity instanceof City && targetEntity.getHealth() < 0) {
				targetEntity.setHealth(1);
			}

			if (targetEntity.getHealth() > 0) {
				UnitAttackPacket attackPacket = new UnitAttackPacket();
				attackPacket.setUnitLocations(attackingEntity.getTile().getGridX(),
						attackingEntity.getTile().getGridY(), targetEntity.getTile().getGridX(),
						targetEntity.getTile().getGridY());
				attackPacket.setUnitDamage(unitDamage);
				attackPacket.setTargetDamage(targetDamage);

				for (Player player : players) {
					player.getConn().send(json.toJson(attackPacket));
				}
			}

			if (targetEntity.getHealth() <= 0) {
				if (targetEntity instanceof Unit && targetEntity.getTile().getCity() == null) {

					Unit targetUnit = (Unit) targetEntity;
					targetUnit.getStandingTile().removeUnit(targetUnit);

					// FIXME: Redundant code.
					DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
					removeUnitPacket.setUnit(targetUnit.getID(), targetUnit.getStandingTile().getGridX(),
							targetUnit.getStandingTile().getGridY());

					for (Player player : players) {
						player.getConn().send(json.toJson(removeUnitPacket));
					}
				}
			}
		}
	}

	@Override
	public void onWorkTile(WebSocket conn, WorkTilePacket packet) {

		// TODO: !! We need to do territory & ownership checks like in clientside.

		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		for (Unit unit : tile.getUnits()) {
			if (unit instanceof BuilderUnit) {
				BuilderUnit builder = (BuilderUnit) unit;
				builder.setBuilding(true);
				builder.setImprovement(packet.getImprovementType());
				builder.reduceMovement(2);
			}

			if (unit instanceof WorkBoatUnit) {
				WorkBoatUnit workBoat = (WorkBoatUnit) unit;
				// workBoat.setBuilding(true);
				// workBoat.setImprovement(packet.getImprovementType());
				workBoat.reduceMovement(2);
			}
		}
	}

	@Override
	public String toString() {
		return "InGame";
	}

	private boolean playersLoaded() {
		for (Player player : players)
			if (!player.isLoaded())
				return false;

		return true;
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

	private int getUpdatedTurnTime() {
		int cityMultiplier = 1;
		int unitMultiplier = 1;
		return BASE_TURN_TIME + getMaxPlayerCities() * cityMultiplier + getMaxPlayerUnits() * unitMultiplier;
	}

	private int getTurnTimeLeft() {
		return turnTimeLeft;
	}

	private void loadGame() {
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

			// TODO: Be able to get river tiles AND tiles of a specific type
			ArrayList<Tile> riverTiles = new ArrayList<>(map.getTileIndexer().getAdjacentRiverTiles());

			// Check if the tile is within our bounds.
			int minX = (int) (rect.getX());
			int minY = (int) (rect.getY());
			int maxX = (int) (rect.getX() + rect.getWidth());
			int maxY = (int) (rect.getY() + rect.getHeight());

			int iterations = 0;
			while (true) {
				for (Tile tile : riverTiles) {
					if (tile.getGridX() > minX && tile.getGridX() < maxX && tile.getGridY() > minY
							&& tile.getGridY() < maxY) {

						boolean adjToBias = false;

						if (player.getCivType().getBiasTileType() != null) {
							for (Tile adjTile : tile.getAdjTiles())
								if (adjTile.containsTileType(player.getCivType().getBiasTileType()))
									adjToBias = true;
						} else
							adjToBias = true; // If we don't have a bias, just set we are adj no matter what.

						boolean adjToTundra = tile.getBaseTileType() == TileType.TUNDRA
								|| tile.getBaseTileType() == TileType.TUNDRA_HILL; // Can still be false.
						for (Tile adjTile : tile.getAdjTiles()) {
							if (adjTile.getBaseTileType() == TileType.TUNDRA
									|| adjTile.getBaseTileType() == TileType.TUNDRA_HILL)
								adjToTundra = true;
						}

						if (adjToBias && !adjToTundra) {
							if (!tile.containsTileProperty(TileProperty.WATER)
									&& !tile.containsTileType(TileType.MOUNTAIN))
								player.setSpawnPos(tile.getGridX(), tile.getGridY());
							break;

						}
					}
				}

				if (player.hasSpawnPos() || iterations == 0)
					break;

				iterations++;
			}

			// FIXME: We might not be able to spawn the player within the bounds.
			if (!player.hasSpawnPos()) {
				System.out.println("No suitable spawn pos for: " + player.getName());
				while (true) {
					// Just pick a random tile on the map

					int rndX = rnd.nextInt(maxX - minX + 1) + minX;
					int rndY = rnd.nextInt(maxY - minY + 1) + minY;
					Tile tile = map.getTiles()[rndX][rndY];
					if (hasSafeTile(tile)) {
						player.setSpawnPos(tile.getGridX(), tile.getGridY());
						break;
					}
				}
			}
		}

		// Debug code
		if (players.size() > 1) {
			players.get(0).setSpawnPos(players.get(1).getSpawnX() + 1, players.get(1).getSpawnY() + 1);
		}

		for (Player player : players) {
			Tile tile = map.getTiles()[player.getSpawnX()][player.getSpawnY()];
			tile.addUnit(new SettlerUnit(player, tile));

			for (Tile adjTile : tile.getAdjTiles()) {
				if (!adjTile.getBaseTileType().hasProperty(TileProperty.WATER)
						&& !adjTile.containsTileType(TileType.MOUNTAIN)) {
					adjTile.addUnit(new WarriorUnit(player, adjTile));
					break;
				}
			}
		}

		for (Player player : players) {
			// Add two luxuries around the player
			int assignedLuxTiles = 0;
			int assignedResourceTiles = 0;
			int loopLimit = 500;
			while ((assignedLuxTiles < 3 || assignedResourceTiles < 2) && loopLimit > 0) {

				int randX = rnd.nextInt(7) - 3;
				int randY = rnd.nextInt(7) - 3;
				Tile tile = map.getTiles()[player.getSpawnX() + randX][player.getSpawnY() + randY];

				// FIXME: Some special resources can be on desert & desert hills.
				if (tile.getBaseTileType().hasProperty(TileProperty.WATER) || tile.getBaseTileType() == TileType.DESERT
						|| tile.getBaseTileType() == TileType.DESERT_HILL
						|| tile.getBaseTileType() == TileType.MOUNTAIN) {
					continue;
				}

				if (assignedLuxTiles < 3) {
					tile.setTileType(TileType.getRandomLandLuxuryTile());
					assignedLuxTiles++;
				} else {

					for (TileTypeWrapper tileWrapper : tile.getTileTypeWrappers())
						if (tileWrapper.getTileType().hasProperty(TileProperty.LUXURY))
							continue;

					tile.setTileType(TileType.getRandomResourceTile());
					assignedResourceTiles++;
				}

				loopLimit--;
			}
		}
	}

	private boolean hasSafeTile(Tile tile) {
		// If the tile itself isn't safe, return false.
		if (tile.containsTileProperty(TileProperty.WATER) || tile.containsTileType(TileType.MOUNTAIN))
			return false;

		boolean hasSafeTile = false;
		for (Tile adjTile : tile.getAdjTiles())
			if (!adjTile.containsTileProperty(TileProperty.WATER) && !adjTile.containsTileType(TileType.MOUNTAIN))
				hasSafeTile = true;

		return hasSafeTile;
	}
}
