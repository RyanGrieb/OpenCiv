package me.rhin.openciv.server.game.unit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.errors.SameMovementTargetException;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.UnitAI;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.type.Barbarians;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileObserver;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.options.GameOptionType;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.CaptureCityListener.CaptureCityEvent;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.UnitFinishedMoveListener;
import me.rhin.openciv.shared.packet.type.AddObservedTilePacket;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.RemoveObservedTilePacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class Unit implements AttackableEntity, TileObserver, NextTurnListener, UnitFinishedMoveListener {

	private static final Logger LOGGER = LoggerFactory.getLogger(Unit.class);

	private static int unitID = 0;

	private ArrayList<Tile> observedTiles;
	protected StatLine combatStrength;
	private StatLine maintenance;
	protected Tile standingTile;
	protected int id;
	private Tile[][] cameFrom;
	protected AbstractPlayer playerOwner;
	private float x, y;
	private float width, height;

	protected Tile targetTile;
	private Tile queuedTile;
	private boolean selected;
	private float pathMovement;
	private float movement;
	private float health;
	private int turnsSinceCombat;
	private UnitAI unitAI;
	private boolean alive;

	public Unit(AbstractPlayer playerOwner, Tile standingTile) {
		this.id = unitID++;
		this.observedTiles = new ArrayList<>();
		this.combatStrength = new StatLine();
		this.maintenance = new StatLine();
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
		this.movement = getMaxMovement();
		this.health = 100;
		this.turnsSinceCombat = 0;
		this.alive = true;

		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		// Note: This listener needs to be called before the addOwnedUnit() ones.
		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(UnitFinishedMoveListener.class, this);

		playerOwner.addOwnedUnit(this);

		setMaintenance(0.25F);
	}

	public abstract float getMovementCost(Tile prevTile, Tile adjTile);

	public abstract List<UnitType> getUnitTypes();

	public abstract Class<? extends Unit> getUpgradedUnit();

	public abstract boolean canUpgrade();

	public abstract String getName();

	@Override
	public void onNextTurn() {

		if (!alive)
			return;

		this.movement = getMaxMovement();

		// Handle maintenance penalty
		if (playerOwner.getStatLine().getStatValue(Stat.GOLD) < 0) {
			Random rnd = new Random();
			int num = rnd.nextInt(10);
			if (num == 0) {
				deleteUnit(DeleteUnitOptions.PLAYER_KILL);
				return;
			}
		}

		// Handle queued movement ----
		if (queuedTile != null) {
			moveToTile(queuedTile);

			if (standingTile == queuedTile)
				queuedTile = null;
		}

		// Handle health regen
		if (turnsSinceCombat < 2 || health >= 100) {

			turnsSinceCombat++;
			return;
		}

		if (standingTile.getTerritory() != null && standingTile.getTerritory().getPlayerOwner().equals(playerOwner)) {
			// Set health.
			this.health += 15;
		} else
			this.health += 10;

		if (health > 100)
			health = 100;

		Json json = new Json();

		SetUnitHealthPacket packet = new SetUnitHealthPacket();
		packet.setUnit(playerOwner.getName(), id, standingTile.getGridX(), standingTile.getGridY(), health);

		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));

		turnsSinceCombat++;
	}

	@Override
	public void onUnitFinishMove(Tile prevTile, Unit unit) {
		if (health <= 0)
			return;

		Json json = new Json();

		// Handle capturing barbarian camps
		if (unit.getStandingTile().containsTileType(TileType.BARBARIAN_CAMP)
				&& !(unit.getPlayerOwner().getCiv() instanceof Barbarians)) {
			unit.captureBarbarianCamp();
		}

		// Handle capturing ruins
		if (unit.getStandingTile().containsTileType(TileType.RUINS) && unit.getPlayerOwner() instanceof Player) {
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
	}

	@Override
	public boolean isUnitCapturable(AbstractPlayer player) {
		return player.canCaptureUnit(this);
	}

	@Override
	public boolean ignoresTileObstructions() {
		return false;
	}

	@Override
	public void setIgnoresTileObstructions(boolean ignoresTileObstructions) {
	}

	@Override
	public void addObeservedTile(Tile tile) {
		observedTiles.add(tile);

		// If condition
		if (Server.getInstance().getGameOptions().getOption(GameOptionType.SHOW_OBSERVED_TILES) == 0)
			return;

		AddObservedTilePacket packet = new AddObservedTilePacket();
		packet.setTileObserver(playerOwner.getName(), id, tile.getGridX(), tile.getGridY());

		Json json = new Json();

		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));
	}

	@Override
	public void removeObeservedTile(Tile tile) {
		observedTiles.remove(tile);

		// If condition
		if (Server.getInstance().getGameOptions().getOption(GameOptionType.SHOW_OBSERVED_TILES) == 0)
			return;

		RemoveObservedTilePacket packet = new RemoveObservedTilePacket();
		packet.setTileObserver(playerOwner.getName(), id, tile.getGridX(), tile.getGridY());

		Json json = new Json();

		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(packet));
	}

	// FIXME: Replace getStandingTile method
	@Override
	public Tile getTile() {
		return standingTile;
	}

	@Override
	public float getDamageTaken(AttackableEntity otherEntity, boolean entityDefending) {
		if (isUnitCapturable(otherEntity.getPlayerOwner()))
			return 100;

		if (otherEntity.isUnitCapturable(playerOwner))
			return 0;

		// y=30*1.041^(x), x= combat diff

		// FIXME: This code is not ideal, have separate mele & ranged classes for this
		float otherEntityCombatStrength = otherEntity.getCombatStrength(this);
		if (otherEntity instanceof RangedUnit)
			otherEntityCombatStrength = ((RangedUnit) otherEntity).getRangedCombatStrength(this);

		float tileCombatModifier = entityDefending ? standingTile.getCombatModifier() : 1;

		// LOGGER.info(entityDefending + "," + playerOwner.getCivType().name());

		// FIXME: This doesn't account for units that have > 2 movement
		if (entityDefending && !(otherEntity instanceof RangedUnit)) {
			for (int i = 0; i < standingTile.getRiverSides().length; i++)
				if (standingTile.getRiverSides()[i] && standingTile.getAdjTiles()[i].equals(otherEntity.getTile())) {
					tileCombatModifier -= 0.15F;
				}
		}

		return (float) (30 * (Math.pow(1.041, otherEntityCombatStrength - getCombatStrength(otherEntity))))
				* tileCombatModifier;
	}

	@Override
	public boolean surviveAttack(AttackableEntity otherEntity) {
		return health - getDamageTaken(otherEntity, true) > 0;
	}

	@Override
	public void setHealth(float health) {
		this.health = health;
	}

	@Override
	public void onCombat() {
		turnsSinceCombat = 0;
	}

	@Override
	public float getHealth() {
		return health;
	}

	@Override
	public float getCombatStrength(AttackableEntity target) {
		return combatStrength.getStatValue(Stat.COMBAT_STRENGTH);
	}

	@Override
	public String toString() {
		return "(ID:" + id + ", Owner:" + playerOwner.getCiv().getName() + " - [" + standingTile.getGridX() + ","
				+ standingTile.getGridY() + "]" + ")";
	}

	@Override
	public ArrayList<Tile> getObservedTiles() {
		return observedTiles;
	}

	// TODO: Just added this, use this in other places in the unit class.
	public void setStandingTile(Tile standingTile) {
		this.standingTile = standingTile;
		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
	}

	public void clearListeners() {

		if (unitAI != null)
			unitAI.clearListeners();

		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

	public boolean setTargetTile(Tile targetTile) {

		if (targetTile.equals(this.targetTile)) {
			throw new SameMovementTargetException();
		}

		// FIXME: This only accounts for units w/ movement < 3
		if (standingTile.getDistanceFrom(targetTile) > 60) {
			LOGGER.warn("WARNING: Set target tile w/ unexcpected distance: " + this);
		}

		int h = 0;

		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();
		int maxNodes = Server.getInstance().getMap().getMaxNodes();

		ArrayList<Tile> openSet = new ArrayList<>();
		cameFrom = new Tile[width][height];
		float[][] gScores = new float[width][height];
		float[][] fScores = new float[width][height];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, maxNodes);
		for (float[] fScore : fScores)
			Arrays.fill(fScore, maxNodes);

		gScores[standingTile.getGridX()][standingTile.getGridY()] = 0;
		fScores[standingTile.getGridX()][standingTile.getGridY()] = h;
		openSet.add(standingTile); // h or 0 ???

		while (openSet.size() > 0) {

			// Get the current tileNode /w the lowest fScore[] value.
			// FIXME: This can be O(1) /w a proper priority queue.
			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

				if (current.getEnemyAttackableEntity(playerOwner) != null) {
					tenativeGScore += 100;
				}

				if (tenativeGScore < gScores[adjTile.getGridX()][adjTile.getGridY()]) {

					cameFrom[adjTile.getGridX()][adjTile.getGridY()] = current;
					gScores[adjTile.getGridX()][adjTile.getGridY()] = tenativeGScore;

					float adjFScore = gScores[adjTile.getGridX()][adjTile.getGridY()] + h;
					fScores[adjTile.getGridX()][adjTile.getGridY()] = adjFScore;
					if (!openSet.contains(adjTile)) {
						openSet.add(adjTile);
					}
				}
			}
		}

		// Iterate through the parent array to get back to the origin tile.

		Tile parentTile = cameFrom[targetTile.getGridX()][targetTile.getGridY()];

		// If it's moving to itself or there isn't a valid path
		if (parentTile == null) {
			pathMovement = 0;
			return false;
		}

		int iterations = 0;
		float pathMovement = 0;
		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile == null)
				nextTile = targetTile;

			if (!parentTile.equals(standingTile)) {
				pathMovement += getMovementCost(nextTile, parentTile);
			}

			if (parentTile.equals(targetTile)) {
				break;
			}

			if (iterations >= maxNodes) {
				break;
			}

			parentTile = nextTile;
			iterations++;
		}

		this.targetTile = targetTile;
		this.pathMovement = pathMovement;

		return true;
	}

	public void moveToTargetTile() {
		if (targetTile == null)
			return;

		standingTile.removeUnit(this);
		targetTile.addUnit(this);

		setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2, targetTile.getVectors()[0].y + 4);
		standingTile = targetTile;

		// TODO: Determine if we still have no movement left.

		targetTile = null;
		selected = false;
	}

	public boolean moveToTile(Tile tile) {

		Tile prevTile = standingTile;
		ArrayList<Tile> pathTiles = new ArrayList<>();
		pathTiles = getPathTiles(tile);

		// If we don't have a valid path, return.
		if (pathTiles.size() < 1 || standingTile.equals(targetTile)) {
			targetTile = null;
			return false;
		}

		Tile pathingTile = stepTowardTarget(pathTiles);

		/*
		 * The following sends the proper packets & information to move the unit to the
		 * tile
		 */
		if (standingTile.equals(pathingTile)) {
			LOGGER.error("ERROR: Couldn't move to target");
			return false;
		}

		if (!canStandOnTile(pathingTile)) {
			LOGGER.error("ERROR: Unit can't stand on tile");
			return false;
		}

		setTargetTile(pathingTile);

		MoveUnitPacket packet = new MoveUnitPacket();
		packet.setUnit(playerOwner.getName(), id, standingTile.getGridX(), standingTile.getGridY(),
				pathingTile.getGridX(), pathingTile.getGridY());
		packet.setMovementCost(getPathMovement());

		moveToTargetTile();
		reduceMovement(getPathMovement());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(packet));
		}

		Server.getInstance().getEventManager().fireEvent(new UnitFinishedMoveEvent(prevTile, this));

		return true;
	}

	public boolean canStandOnTile(Tile tile) {
		if (tile.getUnits().size() < 1)
			return true;

		// Unit can't start on a tile if there is already a support unit & our unit is a
		// support unit
		if (tile.getUnitByType(UnitType.SUPPORT) != null && getUnitTypes().contains(UnitType.SUPPORT))
			return false;

		// Unit can't stand on a tile w/ other similar units
		if (tile.getUnitByType(UnitType.SUPPORT) == null && !getUnitTypes().contains(UnitType.SUPPORT))
			return false;

		return true;
	}

	public void reduceMovement(float movementCost) {
		movement -= movementCost;

		if (movement < 0)
			movement = 0;
	}

	public void setMovement(float movement) {
		this.movement = movement;
	}

	public float getMovement() {
		return movement;
	}

	public void setPosition(float x, float y) {
		this.x = x;
		this.y = y;
	}

	public void setSize(float width, float height) {
		this.width = width;
		this.height = height;
	}

	public void setSelected(boolean selected) {
		this.selected = selected;
	}

	public float getMaxMovement() {
		return 2;
	}

	public boolean isSelected() {
		return selected;
	}

	public Tile getStandingTile() {
		return standingTile;
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public AbstractPlayer getPlayerOwner() {
		return playerOwner;
	}

	public float getPathMovement() {
		return pathMovement;
	}

	public int getID() {
		return id;
	}

	public void setPlayerOwner(AbstractPlayer playerOwner) {
		this.playerOwner = playerOwner;

		if (unitAI != null) {
			unitAI.clearListeners();
			unitAI = null;
		}
	}

	public Tile[][] getCameFromTiles() {
		return cameFrom;
	}

	protected void onKill(ArrayList<DeleteUnitOptions> optionList) {
		// Called if we want to store this unit & re-add later.
		if (optionList.contains(DeleteUnitOptions.KEEP_LISTENERS))
			return;

		clearListeners();
		alive = false;
	}

	public StatLine getCombatStatLine() {
		return combatStrength;
	}

	protected Tile removeSmallest(ArrayList<Tile> queue, float fScore[][]) {
		float smallest = Integer.MAX_VALUE;
		Tile smallestTile = null;
		for (Tile tile : queue) {
			if (fScore[tile.getGridX()][tile.getGridY()] < smallest) {
				smallest = fScore[tile.getGridX()][tile.getGridY()];
				smallestTile = tile;
			}
		}

		queue.remove(smallestTile);
		return smallestTile;
	}

	public void addAIBehavior(UnitAI unitAI) {
		if (this.unitAI != null) {
			LOGGER.error("Error: AI behavior already defined for unit: " + this);
		}

		this.unitAI = unitAI;
	}

	public boolean isAlive() {
		return alive;
	}

	public void attackEntity(AttackableEntity targetEntity) {

		if (!playerOwner.getDiplomacy().atWar(targetEntity.getPlayerOwner()))
			playerOwner.getDiplomacy().declareWar(targetEntity.getPlayerOwner());

		// FIXME: Include AI players in this list.
		ArrayList<Player> players = Server.getInstance().getPlayers();

		Json json = new Json();
		float unitDamage = this.getDamageTaken(targetEntity, false);
		float targetDamage = targetEntity.getDamageTaken(this, true);

		this.onCombat();
		targetEntity.onCombat();

		// System.out.print(id + " [" + standingTile.getGridX() + "," +
		// standingTile.getGridY() + "] attacking: ");
		// LOGGER.info(targetEntity + " [" + targetEntity.getTile().getGridX() +
		// ","
		// + targetEntity.getTile().getGridY() + "] ");

		this.setHealth(this.getHealth() - unitDamage);
		targetEntity.setHealth(targetEntity.getHealth() - targetDamage);

		if (targetEntity.getHealth() > 0) {
			UnitAttackPacket attackPacket = new UnitAttackPacket();
			attackPacket.setUnitLocations(this.getStandingTile().getGridX(), this.getStandingTile().getGridY(),
					targetEntity.getTile().getGridX(), targetEntity.getTile().getGridY());
			attackPacket.setUnitDamage(unitDamage);
			attackPacket.setTargetDamage(targetDamage);
			attackPacket.setIDs(id, targetEntity.getID());

			for (Player player : players) {
				player.sendPacket(json.toJson(attackPacket));
			}
		}

		// Delete units below 1 hp
		if (targetEntity.getHealth() <= 0) {

			// Update the unit's health to all players
			SetUnitHealthPacket healthPacket = new SetUnitHealthPacket();
			healthPacket.setUnit(playerOwner.getName(), id, standingTile.getGridX(), standingTile.getGridY(), health);

			for (Player player : Server.getInstance().getPlayers())
				player.sendPacket(json.toJson(healthPacket));

			if (targetEntity instanceof Unit && targetEntity.getTile().getCity() == null) {

				Unit targetUnit = (Unit) targetEntity;
				targetUnit.deleteUnit(DeleteUnitOptions.PLAYER_KILL);
			}

			// When we capture a city
			if (targetEntity instanceof City) {

				City city = (City) targetEntity;
				city.setHealth(city.getMaxHealth() / 2);

				// Reduce statline of the original owner
				city.getPlayerOwner().reduceStatLine(city.getStatLine());

				AbstractPlayer oldPlayer = city.getPlayerOwner();

				city.getPlayerOwner().removeCity(city);
				city.setOwner(playerOwner);
				this.getPlayerOwner().addCity(city);

				SetCityOwnerPacket cityOwnerPacket = new SetCityOwnerPacket();
				cityOwnerPacket.setCity(city.getName(), oldPlayer.getName(), playerOwner.getName());

				for (Player player : players) {
					player.sendPacket(json.toJson(cityOwnerPacket));
				}

				SetCityHealthPacket cityHealthPacket = new SetCityHealthPacket();
				cityHealthPacket.setCity(city.getName(), city.getMaxHealth() / 2);

				for (Player player : players) {
					player.sendPacket(json.toJson(cityHealthPacket));
				}

				city.updateWorkedTiles();
				city.getPlayerOwner().updateOwnedStatlines(false);

				// Kill all enemy units inside the city
				Iterator<Unit> unitIterator = city.getTile().getUnits().iterator();
				while (unitIterator.hasNext()) {
					Unit cityUnit = unitIterator.next();

					if (!cityUnit.getPlayerOwner().equals(this.getPlayerOwner())) {

						unitIterator.remove();
						cityUnit.deleteUnit(DeleteUnitOptions.PLAYER_KILL);
					}
				}

				Server.getInstance().getEventManager().fireEvent(new CaptureCityEvent(city, oldPlayer));
			}
		}

		if (this.getHealth() <= 0) {
			deleteUnit(DeleteUnitOptions.PLAYER_KILL);
		}
	}

	// FIXME: Convey playerKill variable better. It's confusing
	public void deleteUnit(DeleteUnitOptions... options) {

		ArrayList<DeleteUnitOptions> optionList = new ArrayList<>();
		Collections.addAll(optionList, options);

		standingTile.removeUnit(this);
		onKill(optionList);
		playerOwner.removeUnit(this);

		// FIXME: Redundant code.
		DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
		removeUnitPacket.setUnit(id, standingTile.getGridX(), standingTile.getGridY());

		boolean playerKill = optionList.contains(DeleteUnitOptions.PLAYER_KILL);

		removeUnitPacket.setKilled(playerKill);

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(removeUnitPacket));
		}

		playerOwner.updateOwnedStatlines(false);
	}

	public boolean canAttack(AttackableEntity attackableEntity) {

		boolean nearTarget = false;

		ArrayList<Tile> adjTiles = new ArrayList<>();
		adjTiles.add(standingTile);

		for (Tile tile : standingTile.getAdjTiles())
			adjTiles.add(tile);

		for (Tile tile : adjTiles) {
			AttackableEntity tileEntity = tile.getEnemyAttackableEntity(playerOwner);
			if (tileEntity != null && tileEntity.equals(attackableEntity)
					&& !tileEntity.getPlayerOwner().equals(playerOwner))
				nearTarget = true;
		}

		if (nearTarget && movement - getMovementCost(standingTile, attackableEntity.getTile()) < 0) {
			return false;
		}

		return nearTarget;
	}

	public UnitAI getAIBehavior() {
		return unitAI;
	}

	public void captureBarbarianCamp() {
		Tile campTile = standingTile;
		campTile.removeTileType(TileType.BARBARIAN_CAMP);

		RemoveTileTypePacket removeTileTypePacket = new RemoveTileTypePacket();
		removeTileTypePacket.setTile(TileType.BARBARIAN_CAMP.name(), campTile.getGridX(), campTile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.sendPacket(json.toJson(removeTileTypePacket));

		playerOwner.getStatLine().addValue(Stat.GOLD, 50);
		playerOwner.updateOwnedStatlines(false);
	}

	/**
	 * Captures this unit
	 * 
	 * @param playerOwner
	 */
	public void capture(Player attackingPlayer) {

		if (!playerOwner.getDiplomacy().atWar(attackingPlayer))
			attackingPlayer.getDiplomacy().declareWar(playerOwner);

		// Problem: Wrong id being set in the packet?

		String prevPlayerOwner = playerOwner.getName();

		playerOwner.removeUnit(this);
		setPlayerOwner(attackingPlayer);
		setMovement(getMaxMovement());

		SetUnitOwnerPacket setOwnerPacket = new SetUnitOwnerPacket();
		setOwnerPacket.setUnit(attackingPlayer.getName(), prevPlayerOwner, id, standingTile.getGridX(),
				standingTile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(setOwnerPacket));
		}
	}

	public StatLine getMaintenance() {
		return maintenance;
	}

	public void upgrade() {
		// TODO: Copy XP too

		// Create new unit obj from class

		Unit unit = null;
		try {
			unit = (Unit) ClassReflection.getConstructor(getUpgradedUnit(), AbstractPlayer.class, Tile.class)
					.newInstance(playerOwner, standingTile);
		} catch (Exception e) {
			e.printStackTrace();
		}

		unit.getPlayerOwner().getStatLine().subValue(Stat.GOLD, 100);
		unit.getPlayerOwner().updateOwnedStatlines(false);
		standingTile.addUnit(unit);
		unit.setHealth(health);

		AddUnitPacket addUnitPacket = new AddUnitPacket();
		addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unit.getName(), unit.getID(), standingTile.getGridX(),
				standingTile.getGridY());

		SetUnitHealthPacket healthPacket = new SetUnitHealthPacket();
		healthPacket.setUnit(unit.getPlayerOwner().getName(), unit.getID(), standingTile.getGridX(),
				standingTile.getGridY(), health);

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(addUnitPacket));
			player.sendPacket(json.toJson(healthPacket));
		}

		deleteUnit(DeleteUnitOptions.SERVER_DELETE);
	}

	public void setQueuedTile(Tile queuedTile) {
		this.queuedTile = queuedTile;
	}

	/**
	 * Returns the shortest path of tiles to the target.
	 * 
	 * @param targetTile
	 * @return
	 */
	public ArrayList<Tile> getPathTiles(Tile targetTile) {

		int width = Server.getInstance().getMap().getWidth();
		int height = Server.getInstance().getMap().getHeight();

		int h = 0;
		ArrayList<Tile> openSet = new ArrayList<>();
		Tile[][] cameFrom = new Tile[width][height];
		float[][] gScores = new float[width][height];
		float[][] fScores = new float[width][height];

		for (float[] gScore : gScores)
			Arrays.fill(gScore, width * height);
		for (float[] fScore : fScores)
			Arrays.fill(fScore, width * height);

		gScores[standingTile.getGridX()][standingTile.getGridY()] = 0;
		fScores[standingTile.getGridX()][standingTile.getGridY()] = h;
		openSet.add(standingTile); // h or 0 ???

		while (openSet.size() > 0) {

			// Get the current tileNode /w the lowest fScore[] value.
			// FIXME: This can be O(1) /w a proper priority queue.
			Tile current = removeSmallest(openSet, fScores);

			if (current.equals(targetTile))
				break;

			openSet.remove(current);
			for (Tile adjTile : current.getAdjTiles()) {
				if (adjTile == null)
					continue;

				// FIXME: Make units & cities increase gScore.
				float tenativeGScore = gScores[current.getGridX()][current.getGridY()]
						+ getMovementCost(current, adjTile);

				// Avoid walking into cities.
				if (current.getCity() != null && !current.getCity().getPlayerOwner().equals(playerOwner))
					tenativeGScore += 10000;

				// Avoid units
				if (current.getUnits().size() > 0 && !current.getTopUnit().getPlayerOwner().equals(playerOwner)
						&& !current.getTopUnit().equals(this)) {
					tenativeGScore += 10000;
				}

				if (tenativeGScore < gScores[adjTile.getGridX()][adjTile.getGridY()]) {

					cameFrom[adjTile.getGridX()][adjTile.getGridY()] = current;
					gScores[adjTile.getGridX()][adjTile.getGridY()] = tenativeGScore;

					float adjFScore = gScores[adjTile.getGridX()][adjTile.getGridY()] + h;
					fScores[adjTile.getGridX()][adjTile.getGridY()] = adjFScore;
					if (!openSet.contains(adjTile)) {
						openSet.add(adjTile);
					}
				}
			}
		}

		// Iterate through the parent array to get back to the origin tile.

		// Iterate through the parent array to get back to the origin tile.

		Tile parentTile = cameFrom[targetTile.getGridX()][targetTile.getGridY()];

		// If it's moving to itself or there isn't a valid path
		if (parentTile == null) {
			targetTile = null;
		}

		// LOGGER.info("Target:" + targetTile);
		int iterations = 0;
		ArrayList<Tile> pathTiles = new ArrayList<>();

		if (targetTile != null && parentTile != null) {
			pathTiles.add(targetTile);
			pathTiles.add(parentTile);
		}

		while (parentTile != null) {
			Tile nextTile = cameFrom[parentTile.getGridX()][parentTile.getGridY()];

			if (nextTile == null)
				break;

			if (parentTile.equals(targetTile)) {
				break;
			}
			if (iterations >= 10000) {
				targetTile = null;
				break;
			}
			pathTiles.add(nextTile);

			parentTile = nextTile;
		}

		// pathTiles.remove(0);
		return pathTiles;
	}

	/**
	 * Returns the farthest tile the unit can move to, based on the units movement.
	 * 
	 * @param pathTiles The path we want to take.
	 * @return Tile - The closest tile we can walk to currently.
	 */
	public Tile stepTowardTarget(ArrayList<Tile> pathTiles) {

		if (pathTiles.size() < 1)
			return null;

		Tile pathingTile = null;
		Tile targetTile = pathTiles.get(0);
		int index = 0;
		float movementCost = 0;
		Tile prevPathedTile = standingTile;
		for (int i = pathTiles.size() - 1; i >= 0; i--) {
			Tile pathTile = pathTiles.get(i);

			if (pathTile.equals(prevPathedTile))
				continue;
			// LOGGER.info("Comparing:" + prevPathedTile + " | " + pathTile);

			movementCost += getMovementCost(prevPathedTile, pathTile);

			// Stop the unit the tile before an enemy unit. Or a tile that has the same
			// unitType on it.
			Unit topUnit = pathTile.getTopUnit();
			if (topUnit != null && (!topUnit.getPlayerOwner().equals(playerOwner)
					|| (topUnit.getPlayerOwner().equals(playerOwner) && pathTile.containsUnitTypes(getUnitTypes())))) {
				pathingTile = prevPathedTile;
				break;
			}

			if (movementCost > getMovement()) {
				pathingTile = prevPathedTile;
				break;
			}

			if (movementCost == getMovement() || pathTile.equals(targetTile)) {
				pathingTile = pathTile;
				break;
			}

			prevPathedTile = pathTile;
			index++;
		}

		// LOGGER.info("Walking to: " + pathingTile);
		return pathingTile;
	}

	protected void setMaintenance(float amount) {
		maintenance.setValue(Stat.MAINTENANCE, amount);
		playerOwner.updateOwnedStatlines(false);
	}
}
