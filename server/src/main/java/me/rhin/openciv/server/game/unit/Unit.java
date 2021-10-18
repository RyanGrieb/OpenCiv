package me.rhin.openciv.server.game.unit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.unit.UnitAI;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.CaptureCityListener.CaptureCityEvent;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class Unit implements AttackableEntity, NextTurnListener {

	private static int unitID = 0;

	protected StatLine combatStrength;
	protected Tile standingTile;
	private int id;
	private Tile[][] cameFrom;
	private ArrayList<Vector2[]> pathVectors = new ArrayList<>();
	protected AbstractPlayer playerOwner;
	private float x, y;
	private float width, height;

	protected Tile targetTile;
	private boolean selected;
	private float pathMovement;
	private float movement;
	private float health;
	private int turnsSinceCombat;
	private UnitAI unitAI;
	private boolean alive;

	public Unit(AbstractPlayer playerOwner, Tile standingTile) {
		this.id = unitID++;
		this.combatStrength = new StatLine();
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
		this.movement = getMaxMovement();
		this.health = 100;
		this.turnsSinceCombat = 0;
		this.alive = true;
		setPosition(standingTile.getVectors()[0].x - standingTile.getWidth() / 2, standingTile.getVectors()[0].y + 4);
		setSize(standingTile.getWidth(), standingTile.getHeight());

		playerOwner.addOwnedUnit(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	public abstract float getMovementCost(Tile prevTile, Tile adjTile);

	public abstract List<UnitType> getUnitTypes();

	@Override
	public void onNextTurn() {

		if (!alive)
			return;

		this.movement = getMaxMovement();

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
	public boolean isUnitCapturable() {
		return false;
	}

	// FIXME: Replace getStandingTile method
	@Override
	public Tile getTile() {
		return standingTile;
	}

	@Override
	public float getDamageTaken(AttackableEntity otherEntity, boolean entityDefending) {
		if (isUnitCapturable())
			return 100;

		if (otherEntity.isUnitCapturable())
			return 0;

		// y=30*1.041^(x), x= combat diff

		// FIXME: This code is not ideal, have separate mele & ranged classes for this
		float otherEntityCombatStrength = otherEntity.getCombatStrength(this);
		if (otherEntity instanceof RangedUnit)
			otherEntityCombatStrength = ((RangedUnit) otherEntity).getRangedCombatStrength(this);

		float tileCombatModifier = entityDefending ? standingTile.getCombatModifier() : 1;

		// System.out.println(entityDefending + "," + playerOwner.getCivType().name());

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

	public void clearListeners() {

		if (unitAI != null)
			unitAI.clearListeners();

		Server.getInstance().getEventManager().clearListenersFromObject(this);
	}

	public boolean setTargetTile(Tile targetTile) {
		if (targetTile == null)
			return false;

		if (targetTile.equals(this.targetTile))
			return false;

		pathVectors.clear();

		// Find the shortest path to the target tile.
		// Remember:
		/*
		 * EDGES are lines pointing to another node. (Stores the others nodes location
		 * or instance).
		 * 
		 * NODES or VERTICES are the nodes (in this case our hexes) on the map!.
		 */

		// https://en.wikipedia.org/wiki/A*_search_algorithm
		// https://www.youtube.com/watch?v=6TsL96NAZCo

		// Remember, stack is LIFO.

		// int aScore = costOfPath + hurestic of the target point.

		// Tile should store is hurestic, tileNode should store is aScore.

		// FIXME: This shouldn't be a static number. (E.g. account for hills, ect.)
		// SHOULD NEVERRRR OVERESTIMATE tough
		int h = 0; // Lowest possible cost to reach nearest tile. (Do we want to
					// overestimate
		// this?).

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

			if (nextTile != null) {
				Vector2[] tileVectors = new Vector2[2];
				tileVectors[0] = new Vector2(parentTile.getX() + parentTile.getWidth() / 2,
						parentTile.getY() + parentTile.getHeight() / 2 + 4);
				tileVectors[1] = new Vector2(nextTile.getX() + nextTile.getWidth() / 2,
						nextTile.getY() + nextTile.getHeight() / 2 + 4);
				pathVectors.add(tileVectors);
			}

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

		pathVectors.clear();

		standingTile.removeUnit(this);
		targetTile.addUnit(this);

		setPosition(targetTile.getVectors()[0].x - targetTile.getWidth() / 2, targetTile.getVectors()[0].y + 4);
		standingTile = targetTile;

		// TODO: Determine if we still have no movement left.

		targetTile = null;
		selected = false;
	}

	public void reduceMovement(float movementCost) {
		movement -= movementCost;

		if (movement < 0)
			movement = 0;
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

	public ArrayList<Vector2[]> getPathVectors() {
		return pathVectors;
	}

	public float getPathMovement() {
		return pathMovement;
	}

	public int getID() {
		return id;
	}

	public void setPlayerOwner(AbstractPlayer playerOwner) {
		this.playerOwner = playerOwner;
	}

	public Tile[][] getCameFromTiles() {
		return cameFrom;
	}

	public void kill() {
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
		this.unitAI = unitAI;
	}

	public boolean isAlive() {
		return alive;
	}

	public void attackEntity(AttackableEntity targetEntity) {

		// FIXME: Include AI players in this list.
		ArrayList<Player> players = Server.getInstance().getPlayers();

		Json json = new Json();
		float unitDamage = this.getDamageTaken(targetEntity, false);
		float targetDamage = targetEntity.getDamageTaken(this, true);

		this.onCombat();
		targetEntity.onCombat();

		this.setHealth(this.getHealth() - unitDamage);
		targetEntity.setHealth(targetEntity.getHealth() - targetDamage);

		if (targetEntity.getHealth() > 0) {
			UnitAttackPacket attackPacket = new UnitAttackPacket();
			attackPacket.setUnitLocations(this.getStandingTile().getGridX(), this.getStandingTile().getGridY(),
					targetEntity.getTile().getGridX(), targetEntity.getTile().getGridY());
			attackPacket.setUnitDamage(unitDamage);
			attackPacket.setTargetDamage(targetDamage);

			for (Player player : players) {
				player.sendPacket(json.toJson(attackPacket));
			}
		}

		// Delete units below 1 hp

		// If target is unit, use this method. if city, implement that other one

		// Doesn't get called?

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
						city.getPlayerOwner().removeUnit(cityUnit);
						cityUnit.kill();

						DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
						removeUnitPacket.setUnit(cityUnit.getID(), cityUnit.getStandingTile().getGridX(),
								cityUnit.getStandingTile().getGridY());
						removeUnitPacket.setKilled(true);

						for (Player player : players) {
							player.sendPacket(json.toJson(removeUnitPacket));
						}

					}
				}

				Server.getInstance().getEventManager().fireEvent(new CaptureCityEvent(city, oldPlayer));
			}
		}

		if (this.getHealth() <= 0) {
			this.getStandingTile().removeUnit(this);
			this.playerOwner.removeUnit(this);
			this.kill();

			DeleteUnitPacket removeUnitPacket = new DeleteUnitPacket();
			removeUnitPacket.setUnit(this.getID(), this.getStandingTile().getGridX(),
					this.getStandingTile().getGridY());
			removeUnitPacket.setKilled(true);

			for (Player player : players) {
				player.sendPacket(json.toJson(removeUnitPacket));
			}

		}
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

		playerOwner.getStatLine().addValue(Stat.GOLD, 150);
		playerOwner.updateOwnedStatlines(false);
	}
}
