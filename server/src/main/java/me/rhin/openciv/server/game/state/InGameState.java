package me.rhin.openciv.server.game.state;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.type.BarbarianPlayer;
import me.rhin.openciv.server.game.ai.type.CityStatePlayer;
import me.rhin.openciv.server.game.ai.type.CityStatePlayer.CityStateType;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.server.game.city.wonders.GameWonders;
import me.rhin.openciv.server.game.map.GameMap;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.server.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.server.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
import me.rhin.openciv.server.game.unit.type.WorkBoat.WorkBoatUnit;
import me.rhin.openciv.server.listener.BuyProductionItemListener;
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
import me.rhin.openciv.server.listener.RequestEndTurnListener;
import me.rhin.openciv.server.listener.SelectUnitListener;
import me.rhin.openciv.server.listener.SetProductionItemListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.server.listener.UnitFinishedMoveListener.UnitFinishedMoveEvent;
import me.rhin.openciv.server.listener.UnitMoveListener;
import me.rhin.openciv.server.listener.WorkTileListener;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
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
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.util.MathHelper;

//FIXME: Instead of the civ game listening for everything. Just split them off into the respective classes. (EX: CombatPreviewListener in the Unit class)
//Or just use reflection so we don't have to implement 20+ classes.
public class InGameState extends GameState
		implements DisconnectListener, SelectUnitListener, UnitMoveListener, SettleCityListener,
		PlayerFinishLoadingListener, NextTurnListener, SetProductionItemListener, ClickWorkedTileListener,
		ClickSpecialistListener, EndTurnListener, PlayerListRequestListener, FetchPlayerListener, CombatPreviewListener,
		WorkTileListener, RangedAttackListener, BuyProductionItemListener, RequestEndTurnListener {

	private int currentTurn;
	private int turnTimeLeft;
	private ScheduledExecutorService executor;
	private Runnable turnTimeRunnable;
	private GameMap map;
	private GameWonders gameWonders;

	public InGameState() {

		this.map = new GameMap();
		this.gameWonders = new GameWonders();

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
		Server.getInstance().getEventManager().addListener(BuyProductionItemListener.class, this);
		Server.getInstance().getEventManager().addListener(RequestEndTurnListener.class, this);
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
					}

					TurnTimeLeftPacket turnTimeLeftPacket = new TurnTimeLeftPacket();
					turnTimeLeftPacket.setTime(turnTimeLeft);

					Json json = new Json();
					for (Player player : players)
						player.sendPacket(json.toJson(turnTimeLeftPacket));

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

			PlayerDisconnectPacket packet = new PlayerDisconnectPacket();
			packet.setPlayerName(removedPlayer.getName());
			Json json = new Json();
			player.sendPacket(json.toJson(packet));
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

		// NOTE: We assume player owner is a MPPlayer
		Player playerOwner = (Player) unit.getPlayerOwner();

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
		if (targetTile.getEnemyAttackableEntity(playerOwner) != null)
			if (!targetTile.getEnemyAttackableEntity(playerOwner).getPlayerOwner().equals(unit.getPlayerOwner())
					&& (!targetTile.getEnemyAttackableEntity(playerOwner).isUnitCapturable()
							&& targetTile.getEnemyAttackableEntity(playerOwner).surviveAttack(unit))) {
				targetTile = unit.getCameFromTiles()[targetTile.getGridX()][targetTile.getGridY()];
				if (targetTile != null) {
					unit.setTargetTile(targetTile);
				} else // If the came from tile is null, assume it's where we are standing
					targetTile = unit.getStandingTile();
			}

		// Move to target tile
		if (unit.getMovement() >= unit.getPathMovement() && !unit.getStandingTile().equals(targetTile)) {

			unit.moveToTargetTile();
			playerOwner.setSelectedUnit(null);
			unit.reduceMovement(unit.getPathMovement());

			packet.setMovementCost(unit.getPathMovement());
			packet.setLocation(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

			for (Player player : players) {
				player.sendPacket(json.toJson(packet));
			}
		}

		// If the tile we are moving on has a capturable unit.
		if (targetTile.getCaptureableUnit() != null) {

			Unit targetUnit = targetTile.getCaptureableUnit();

			// When we capture a caravan
			if (targetUnit instanceof CaravanUnit) {
				// TODO: Plunder sound effect
				playerOwner.getStatLine().addValue(Stat.GOLD, 100);
				playerOwner.updateOwnedStatlines(false);

				targetUnit.getStandingTile().removeUnit(targetUnit);
				playerOwner.removeUnit(targetUnit);
				targetUnit.kill();

				// FIXME: Redundant code.
				DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
				removeUnitPacket.setUnit(targetUnit.getID(), targetUnit.getStandingTile().getGridX(),
						targetUnit.getStandingTile().getGridY());
				removeUnitPacket.setKilled(true);

				for (Player player : players) {
					player.sendPacket(json.toJson(removeUnitPacket));
				}

				// When we capture a builder/settler, ect.
			} else {

				// Problem: Wrong id being set in the packet?
				targetUnit.setPlayerOwner(unit.getPlayerOwner());
				SetUnitOwnerPacket setOwnerPacket = new SetUnitOwnerPacket();
				setOwnerPacket.setUnit(targetUnit.getPlayerOwner().getName(), targetUnit.getID(),
						targetUnit.getStandingTile().getGridX(), targetUnit.getStandingTile().getGridY());

				for (Player player : players) {
					player.sendPacket(json.toJson(setOwnerPacket));
				}
			}
		}

		// Handle the targetTile being a enemy unit.
		if (originalTargetTile.getEnemyAttackableEntity(playerOwner) != null)
			if (!originalTargetTile.getEnemyAttackableEntity(playerOwner).getPlayerOwner()
					.equals(unit.getPlayerOwner())) {
				// We are about to attack this unit on the tile
				AttackableEntity targetEntity = originalTargetTile.getEnemyAttackableEntity(playerOwner);
				unit.attackEntity(targetEntity);
			}

		if (unit.getHealth() > 0) {

			// Handle capturing barbarian camps
			if (unit.getStandingTile().containsTileType(TileType.BARBARIAN_CAMP)) {
				unit.captureBarbarianCamp();
			}

			// Handle capturing ruins
			if (unit.getStandingTile().containsTileType(TileType.RUINS)) {
				System.out.println("Handle capture");
				Tile campTile = unit.getStandingTile();
				campTile.removeTileType(TileType.RUINS);

				RemoveTileTypePacket removeTileTypePacket = new RemoveTileTypePacket();
				removeTileTypePacket.setTile(TileType.RUINS.name(), campTile.getGridX(), campTile.getGridY());

				for (Player player : Server.getInstance().getPlayers())
					player.sendPacket(json.toJson(removeTileTypePacket));

				// TODO: Capture ruin sound effect.
				// FIXME: Players don't get gold if they don't have a city.
				unit.getPlayerOwner().getStatLine().addValue(Stat.GOLD, 50);
				playerOwner.updateOwnedStatlines(false);
			}

			Server.getInstance().getEventManager().fireEvent(new UnitFinishedMoveEvent(prevTile, unit));
		}

	}

	// TODO: Move to game map class?
	@Override
	public void onSettleCity(WebSocket conn, SettleCityPacket settleCityPacket) {
		// FIXME: The server needs to check if the unit has movement & is too close to
		// other cities.

		Tile tile = map.getTiles()[settleCityPacket.getGridX()][settleCityPacket.getGridY()];
		SettlerUnit unit = null;

		for (Unit currentUnit : tile.getUnits())
			if (currentUnit instanceof SettlerUnit)
				unit = (SettlerUnit) currentUnit;

		// The player is actually trying to hack if this is triggered
		if (unit == null)
			return;

		unit.settleCity();
	}

	@Override
	public void onPlayerFinishLoading(WebSocket conn) {
		getPlayerByConn(conn).finishLoading();
	}

	@Override
	public void onNextTurn() {

		Json json = new Json();

		currentTurn++;
		turnTimeLeft = getUpdatedTurnTime();

		NextTurnPacket turnTimeUpdatePacket = new NextTurnPacket();
		turnTimeUpdatePacket.setTurnTime(turnTimeLeft);
		for (Player player : players) {
			player.sendPacket(json.toJson(turnTimeUpdatePacket));
		}

		TurnTimeLeftPacket turnTimeLeftPacket = new TurnTimeLeftPacket();
		turnTimeLeftPacket.setTime(turnTimeLeft);

		for (Player player : players)
			player.sendPacket(json.toJson(turnTimeLeftPacket));

		for (Player player : players)
			player.setTurnDone(false);
	}

	// TODO: Move to producibleItemManager
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

	// TODO: Move to producibleItemManager
	@Override
	public void onBuyProductionItem(WebSocket conn, BuyProductionItemPacket packet) {
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

		targetCity.getProducibleItemManager().buyProducingItem(packet.getItemName());

		// Json json = new Json();
		// conn.send(json.toJson(packet));
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
	}

	@Override
	public void onRequestEndTurn(WebSocket conn, RequestEndTurnPacket packet) {
		Player player = Server.getInstance().getPlayerByConn(conn);
		player.setTurnDone(true);

		packet.setPlayerName(player.getName());

		Json json = new Json();
		for (Player otherPlayer : players)
			otherPlayer.sendPacket(json.toJson(packet));

		boolean playersTurnsDone = true;
		for (Player otherPlayer : players)
			if (!otherPlayer.isTurnDone())
				playersTurnsDone = false;

		if (playersTurnsDone)
			Server.getInstance().getEventManager().fireEvent(new NextTurnEvent());
	}

	@Override
	public void onPlayerListRequested(WebSocket conn, PlayerListRequestPacket packet) {
		System.out.println("[SERVER] Player list requested");
		for (Player player : players) {
			packet.addPlayer(player.getName(), player.getCiv().getName().toUpperCase(), false);
		}

		for (AIPlayer aiPlayer : aiPlayers) {
			packet.addPlayer(aiPlayer.getName(), aiPlayer.getCiv().getName().toUpperCase(), true);
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
		Player playerOwner = Server.getInstance().getPlayerByConn(conn);
		AttackableEntity attackingEntity = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()]
				.getUnitFromID(packet.getUnitID());

		AttackableEntity targetEntity = null;
		if (packet.getTargetID() != -1)
			targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
					.getUnitFromID(packet.getTargetID());
		else
			targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()].getCity();

		if (attackingEntity == null || targetEntity == null)
			return;

		if (attackingEntity instanceof RangedUnit) {
			packet.setUnitDamage(0);
		} else
			packet.setUnitDamage(attackingEntity.getDamageTaken(targetEntity, false));

		packet.setTargetDamage(targetEntity.getDamageTaken(attackingEntity, true));

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
			float unitDamage = 0; // A shooting unit takes no damage
			float targetDamage = targetEntity.getDamageTaken(attackingEntity, true);

			attackingEntity.onCombat();
			targetEntity.onCombat();

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
				attackPacket.setIDs(attackingEntity.getID(), targetEntity.getID());

				for (Player player : players) {
					player.sendPacket(json.toJson(attackPacket));
				}
			}

			if (targetEntity.getHealth() <= 0) {
				if (targetEntity instanceof Unit && targetEntity.getTile().getCity() == null) {

					Unit targetUnit = (Unit) targetEntity;

					targetUnit.getStandingTile().removeUnit(targetUnit);
					targetUnit.kill();
					targetUnit.getPlayerOwner().removeUnit(targetUnit);

					// FIXME: Redundant code.
					DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
					removeUnitPacket.setUnit(targetUnit.getID(), targetUnit.getStandingTile().getGridX(),
							targetUnit.getStandingTile().getGridY());
					removeUnitPacket.setKilled(true);

					for (Player player : players) {
						player.sendPacket(json.toJson(removeUnitPacket));
					}
				}
			}
		}
	}

	@Override
	public void onWorkTile(WebSocket conn, WorkTilePacket packet) {

		// TODO: !! We need to do territory & ownership &research checks like in
		// clientside.

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

	@Override
	public GameWonders getWonders() {
		return gameWonders;
	}

	// TODO: Maybe move to Game class.
	public int getCurrentTurn() {
		return currentTurn;
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

		int turnLengthOffset = Server.getInstance().getGameOptions().getTurnLengthOffset();

		if (turnLengthOffset < 0) {
			int cityMultiplier = 1;
			int unitMultiplier = 1;
			return 25 + getMaxPlayerCities() * cityMultiplier + getMaxPlayerUnits() * unitMultiplier;
		} else if (turnLengthOffset == 0) {
			// Infinite turn length
			return Integer.MAX_VALUE;
		} else {
			return 30 + (5 * turnLengthOffset);
		}
	}

	private void loadGame() {
		System.out.println("[SERVER] Starting game...");

		// Add AI
		for (int i = 0; i < 2; i++)
			for (CityStateType type : CityStateType.values()) {
				getAIPlayers().add(new CityStatePlayer(type));
			}

		getAIPlayers().add(new BarbarianPlayer());

		map.generateTerrain();

		// Start the game
		Json json = new Json();
		GameStartPacket gameStartPacket = new GameStartPacket();
		for (Player player : players) {
			player.sendPacket(json.toJson(gameStartPacket));
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

						if (player.getCiv().getBiasTileType() != null) {
							for (Tile adjTile : tile.getAdjTiles())
								if (adjTile.containsTileType(player.getCiv().getBiasTileType()))
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

						// TODO: Implement impassable tile property
						if (adjToBias && !adjToTundra) {
							if (!tile.containsTileProperty(TileProperty.WATER)
									&& !tile.containsTileType(TileType.MOUNTAIN)
									&& !tile.containsTileType(TileType.BARBARIAN_CAMP))
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
			players.get(0).setSpawnPos(players.get(1).getSpawnX() + 2, players.get(1).getSpawnY() + 2);
		}

		// Give players a warrior unit
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

		// Spawn city state AI
		for (AIPlayer aiPlayer : Server.getInstance().getAIPlayers()) {
			if (aiPlayer instanceof CityStatePlayer) {
				CityStatePlayer cityStatePlayer = (CityStatePlayer) aiPlayer;

				// Pick random tile to spawn AI
				Tile tile = null;

				while (tile == null || tile.containsTileProperty(TileProperty.WATER)
						|| tile.containsTileType(TileType.MOUNTAIN) || tile.getUnits().size() > 0
						|| tile.getNearbyUnits().size() > 0) {
					int x = rnd.nextInt(map.getWidth());
					int y = rnd.nextInt(map.getHeight());
					tile = map.getTiles()[x][y];
				}

				Unit settlerUnit = new SettlerUnit(cityStatePlayer, tile);
				tile.addUnit(settlerUnit);

				Unit warriorUnit = new WarriorUnit(cityStatePlayer, tile);
				tile.addUnit(warriorUnit);

				aiPlayer.setSpawnPos(tile.getGridX(), tile.getGridY());
			}
		}

		ArrayList<AbstractPlayer> allPlayers = new ArrayList<>();
		allPlayers.addAll(players);
		allPlayers.addAll(aiPlayers);
		for (AbstractPlayer player : allPlayers) {

			if (player instanceof BarbarianPlayer)
				continue;

			// Add two luxuries around the player
			int assignedLuxTiles = 0;
			int assignedResourceTiles = 0;
			int loopLimit = 500;
			while ((assignedLuxTiles < 3 || assignedResourceTiles < 4) && loopLimit > 0) {

				int randX = rnd.nextInt(5) - 3;
				int randY = rnd.nextInt(5) - 3;

				int x = MathHelper.clamp(player.getSpawnX() + randX, 0, map.getWidth());
				int y = MathHelper.clamp(player.getSpawnY() + randY, 0, map.getHeight());
				Tile tile = map.getTiles()[x][y];

				// FIXME: Some special resources can be on desert & desert hills.
				if (tile.getBaseTileType().hasProperty(TileProperty.WATER) || tile.getBaseTileType() == TileType.DESERT
						|| tile.getBaseTileType() == TileType.DESERT_HILL
						|| tile.getBaseTileType() == TileType.MOUNTAIN) {
					continue;
				}

				for (TileTypeWrapper tileWrapper : tile.getTileTypeWrappers())
					if (tileWrapper.getTileType().hasProperty(TileProperty.LUXURY)
							|| tileWrapper.getTileType().hasProperty(TileProperty.RESOURCE)
							|| tileWrapper.getTileType() == TileType.BARBARIAN_CAMP)
						continue;

				if (assignedLuxTiles < 3) {
					tile.setTileType(TileType.getRandomLandLuxuryTile());
					assignedLuxTiles++;
				} else {
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

	public GameMap getMap() {
		return map;
	}
}
