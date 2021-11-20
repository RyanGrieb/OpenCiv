package me.rhin.openciv.server.game.city;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map.Entry;
import java.util.Random;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.IncreaseTileStatlineBuilding;
import me.rhin.openciv.server.game.city.citizen.AssignedCitizenWorker;
import me.rhin.openciv.server.game.city.citizen.CitizenWorker;
import me.rhin.openciv.server.game.city.citizen.CityCenterCitizenWorker;
import me.rhin.openciv.server.game.city.citizen.EmptyCitizenWorker;
import me.rhin.openciv.server.game.city.citizen.LockedCitizenWorker;
import me.rhin.openciv.server.game.city.specialist.Specialist;
import me.rhin.openciv.server.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.server.game.city.specialist.UnemployedSpecialist;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileObserver;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.listener.CityGrowthListener.CityGrowthEvent;
import me.rhin.openciv.server.listener.CityStarveListener.CityStarveEvent;
import me.rhin.openciv.server.listener.ClickSpecialistListener;
import me.rhin.openciv.server.listener.ClickWorkedTileListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.TerritoryGrowListener.TerritoryGrowEvent;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.util.MathHelper;

public class City implements AttackableEntity, SpecialistContainer, TileObserver, NextTurnListener,
		ClickSpecialistListener, ClickWorkedTileListener {

	private AbstractPlayer playerOwner;
	private String name;
	private Tile originTile;
	private ArrayList<Tile> observedTiles;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private HashMap<Tile, CitizenWorker> citizenWorkers;
	// FIXME: I don't believe we need an array here, we might be able to use just an
	// int.
	private ArrayList<Specialist> unemployedSpecialists;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;
	private float maxHealth;
	private float health;

	public City(AbstractPlayer playerOwner, String name, Tile originTile) {
		this.playerOwner = playerOwner;
		this.name = name;
		this.originTile = originTile;
		this.observedTiles = new ArrayList<>();
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.citizenWorkers = new HashMap<>();
		this.unemployedSpecialists = new ArrayList<>();
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();
		this.maxHealth = 300;
		this.health = maxHealth;

		for (Tile adjTile : originTile.getAdjTiles()) {
			territory.add(adjTile);
			adjTile.setTerritory(this);
		}

		territory.add(originTile);
		originTile.setCity(this);
		originTile.setTerritory(this);

		for (Tile tile : territory) {
			citizenWorkers.put(tile, new EmptyCitizenWorker(this, tile));
		}

		setPopulation(1);
		statLine.setValue(Stat.EXPANSION_REQUIREMENT, 10 + 10 * (float) Math.pow(territory.size() - 6, 1.3));
		statLine.setValue(Stat.MORALE, 100);
		// Add our two specialists, one from pop, one city center
		addSpecialist();
		addSpecialist();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ClickWorkedTileListener.class, this);
		Server.getInstance().getEventManager().addListener(ClickSpecialistListener.class, this);
	}

	public static String getRandomCityName() {
		String cityName = "Unknown";
		boolean identicalName = true;

		while (identicalName) {
			identicalName = false;
			cityName = City.getUnorderedCityName();
			for (Player player : Server.getInstance().getPlayers()) {
				for (City city : player.getOwnedCities()) {
					if (city.getName().equals(cityName))
						identicalName = true;
				}
			}
		}

		return cityName;
	}

	private static String getUnorderedCityName() {
		ArrayList<String> names = new ArrayList<>();
		BufferedReader reader;
		try {
			reader = new BufferedReader(new FileReader("data/cityNames.txt"));
			String line = reader.readLine();
			while (line != null) {
				names.add(line);
				line = reader.readLine();
			}
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}

		Random rnd = new Random();
		return names.get(rnd.nextInt(names.size()));
	}

	@Override
	public void addSpecialist() {
		unemployedSpecialists.add(new UnemployedSpecialist(this));
	}

	@Override
	public void removeSpecialist() {
		unemployedSpecialists.remove(0);

		ArrayList<Tile> topTiles = getTopWorkableTiles();

		Tile topTile = null;

		for (Tile tile : topTiles) {
			if (citizenWorkers.containsKey(tile) && !citizenWorkers.get(tile).isValidTileWorker()) {
				topTile = tile;
				break;
			}
		}

		setCitizenTileWorker(new AssignedCitizenWorker(this, topTile));

		statLine.mergeStatLine(getTileStatLine(topTile));

		Json json = new Json();

		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		playerOwner.sendPacket(json.toJson(statUpdatePacket));
	}

	@Override
	public void onNextTurn() {
		if (!playerOwner.hasConnection())
			return;

		int gainedFood = (int) (statLine.getStatValue(Stat.FOOD_GAIN) - (statLine.getStatValue(Stat.POPULATION) * 2));
		statLine.addValue(Stat.FOOD_SURPLUS, gainedFood);

		int surplusFood = (int) statLine.getStatValue(Stat.FOOD_SURPLUS);
		int population = (int) statLine.getStatValue(Stat.POPULATION);
		int foodRequired = (int) (15 + 8 * (population - 1) + Math.pow(population - 1, 1.5));

		int growthTurns = (foodRequired - surplusFood) / MathHelper.nonZero(gainedFood);

		if (growthTurns < 1 && gainedFood >= 0) {

			setPopulation((int) statLine.getStatValue(Stat.POPULATION) + 1);

			addSpecialist();
			updateWorkedTiles();
		} else if (gainedFood < 0) {
			int starvingTurns = (surplusFood / Math.abs(gainedFood)) + 1;

			if (starvingTurns <= 0) {
				setPopulation((int) statLine.getStatValue(Stat.POPULATION) - 1);
				updateWorkedTiles();
			}
		}

		statLine.addValue(Stat.EXPANSION_PROGRESS, statLine.getStatValue(Stat.HERITAGE_GAIN));

		if (statLine.getStatValue(Stat.EXPANSION_PROGRESS) >= statLine.getStatValue(Stat.EXPANSION_REQUIREMENT)) {

			Tile expansionTile = getTopExpansionTile();

			territory.add(expansionTile);
			expansionTile.setTerritory(this);
			EmptyCitizenWorker citizenWorker = new EmptyCitizenWorker(this, expansionTile);
			citizenWorkers.put(expansionTile, citizenWorker);

			Json json = new Json();
			for (Player player : Server.getInstance().getPlayers()) {
				TerritoryGrowPacket territoryGrowPacket = new TerritoryGrowPacket();
				territoryGrowPacket.setCityName(name);
				territoryGrowPacket.setLocation(expansionTile.getGridX(), expansionTile.getGridY());
				territoryGrowPacket.setOwner(playerOwner.getName());
				player.sendPacket(json.toJson(territoryGrowPacket));
			}

			// FIXME: Have the client automatically add an empty citizen...
			SetCitizenTileWorkerPacket setTileWorkerPacket = new SetCitizenTileWorkerPacket();
			setTileWorkerPacket.setWorker(citizenWorker.getWorkerType(), name, citizenWorker.getTile().getGridX(),
					citizenWorker.getTile().getGridY());

			playerOwner.sendPacket(json.toJson(setTileWorkerPacket));

			int tiles = territory.size() - 6;
			statLine.setValue(Stat.EXPANSION_REQUIREMENT, 10 + 10 * (float) Math.pow(tiles, 1.3));

			updateWorkedTiles();
			// Update the player's statline just in case we start working a non-city value
			// yielded tile.
			playerOwner.updateOwnedStatlines(false);

			Server.getInstance().getEventManager().fireEvent(new TerritoryGrowEvent(this, expansionTile));
		}

		Json json = new Json();
		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}

		playerOwner.sendPacket(json.toJson(statUpdatePacket));

		if (health < getMaxHealth()) {
			health = MathUtils.clamp(health + 5, 0, getMaxHealth());
		}
	}

	// TODO: Move to city class
	@Override
	public void onClickWorkedTile(WebSocket conn, ClickWorkedTilePacket packet) {

		City city = Server.getInstance().getInGameState().getCityFromName(packet.getCityName());

		if (!city.equals(this))
			return;

		clickWorkedTile(Server.getInstance().getMap().getTiles()[packet.getGridX()][packet.getGridY()]);
	}

	// TODO: Move to city class
	@Override
	public void onClickSpecialist(WebSocket conn, ClickSpecialistPacket packet) {

		City city = Server.getInstance().getInGameState().getCityFromName(packet.getCityName());

		if (!city.equals(this))
			return;

		ArrayList<SpecialistContainer> specialistContainers = new ArrayList<>();
		specialistContainers.add(city);

		for (Building building : getBuildings())
			if (building instanceof SpecialistContainer)
				specialistContainers.add((SpecialistContainer) building);

		for (SpecialistContainer container : specialistContainers)
			if (container.getName().equals(packet.getContainerName()))
				removeSpecialistFromContainer(container);
	}

	@Override
	public float getCombatStrength(AttackableEntity targetEntity) {
		return 8;
	}

	// FIXME: Rename this method to isCaptureable & return true
	@Override
	public boolean isUnitCapturable(AbstractPlayer attackingEntity) {
		return false;
	}

	@Override
	public void setHealth(float health) {
		this.health = health;
	}

	@Override
	public float getHealth() {
		return health;
	}

	@Override
	public Tile getTile() {
		return originTile;
	}

	@Override
	public float getDamageTaken(AttackableEntity otherEntity, boolean entityDefending) {
		// Note: we don't apply terrain modifiers for cities, yet?

		float otherEntityCombatStrength = otherEntity.getCombatStrength(this);

		if (otherEntity instanceof RangedUnit) {
			otherEntityCombatStrength = ((RangedUnit) otherEntity).getRangedCombatStrength(this);
		}

		return (float) (30 * (Math.pow(1.041, otherEntityCombatStrength - getCombatStrength(otherEntity))));
	}

	@Override
	public boolean surviveAttack(AttackableEntity otherEntity) {
		return health - getDamageTaken(otherEntity, true) > 0;
	}

	@Override
	public void onCombat() {
		// TODO: Maybe increase health regen when out of combat?
	}

	@Override
	public int getID() {
		return -1;
	}

	@Override
	public boolean ignoresTileObstructions() {
		return false;
	}

	@Override
	public void setIgnoresTileObstructions(boolean ignoresTileObstructions) {
		// Doesn't include cities
	}

	@Override
	public void addObeservedTile(Tile tile) {
		observedTiles.add(tile);
	}

	@Override
	public void removeObeservedTile(Tile tile) {
		observedTiles.remove(tile);
	}

	@Override
	public ArrayList<Tile> getObservedTiles() {
		return observedTiles;
	}

	@Override
	public String toString() {
		return name + " - " + playerOwner.getName();
	}

	public void setMaxHealth(float maxHealth) {
		this.maxHealth = maxHealth;
	}

	public float getMaxHealth() {
		return maxHealth;
	}

	public void updateWorkedTiles() {

		// Make all citizens unemployed
		for (Tile tile : territory) {
			CitizenWorker citizenWorker = citizenWorkers.get(tile);
			if (citizenWorker.getWorkerType() != WorkerType.LOCKED) {

				if (citizenWorker.isValidTileWorker()) {
					statLine.reduceStatLine(getTileStatLine(citizenWorker.getTile()));
					addSpecialist();
				}

				setCitizenTileWorker(new EmptyCitizenWorker(this, citizenWorker.getTile()));
			}
		}

		setCitizenTileWorker(new CityCenterCitizenWorker(this, originTile));
		unemployedSpecialists.remove(0);

		statLine.mergeStatLine(getTileStatLine(originTile));

		float unassignedWorkers = statLine.getStatValue(Stat.POPULATION)
				- getCitizenWorkerAmountOfType(WorkerType.LOCKED);

		for (int i = 0; i < unassignedWorkers; i++) {
			Tile tile = getTopWorkableTiles().get(0);
			if (citizenWorkers.containsKey(tile) && (citizenWorkers.get(tile).isValidTileWorker()))
				continue;

			// FIXME: This is slow, have bulk packets in the future
			setCitizenTileWorker(new AssignedCitizenWorker(this, tile));

			if (unemployedSpecialists.size() > 0)
				unemployedSpecialists.remove(0);

			statLine.mergeStatLine(getTileStatLine(tile));
		}

		// Assume we lost a citizen, and remove a specialist here. (For starving cities)
		if (unemployedSpecialists.size() > 0) {

			// FIXME: This is a workaround to avoid send an unnecessary packet from
			// removeSpecialistFromContainer()

			RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
			packet.setContainer(name, name, -1);

			Json json = new Json();
			playerOwner.sendPacket(json.toJson(packet));
		}

		unemployedSpecialists.clear();

		Json json = new Json();

		// Update city statline
		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		playerOwner.sendPacket(json.toJson(statUpdatePacket));

	}

	public void setCitizenTileWorker(CitizenWorker citizenWorker) {
		citizenWorkers.put(citizenWorker.getTile(), citizenWorker);

		SetCitizenTileWorkerPacket packet = new SetCitizenTileWorkerPacket();
		packet.setWorker(citizenWorker.getWorkerType(), name, citizenWorker.getTile().getGridX(),
				citizenWorker.getTile().getGridY());

		Json json = new Json();
		playerOwner.sendPacket(json.toJson(packet));
	}

	public void removeCitizenWorkerFromTile(Tile tile) {
		CitizenWorker emptyCitizenWorker = new EmptyCitizenWorker(this, tile);
		setCitizenTileWorker(emptyCitizenWorker);

		statLine.reduceStatLine(getTileStatLine(tile));

		CityStatUpdatePacket cityStatUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			cityStatUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}

		Json json = new Json();
		playerOwner.sendPacket(json.toJson(cityStatUpdatePacket));
		playerOwner.updateOwnedStatlines(false);

		addSpecialistToContainer(this);
	}

	public void lockCitizenAtTile(Tile tile) {
		// Take non-locked citizens or unemployed citizens and assign them to the tile

		if (unemployedSpecialists.size() < 1) {

			if (citizenWorkers.get(tile).getWorkerType() == WorkerType.ASSIGNED) {
				removeCitizenWorkerFromTile(tile);
			} else
				for (Entry<Tile, CitizenWorker> entrySet : citizenWorkers.entrySet()) {
					if (entrySet.getValue() instanceof AssignedCitizenWorker) {
						// FIXME: Don't send packets in this instance since we just remove it
						// immediatly.
						removeCitizenWorkerFromTile(entrySet.getKey());
						break;
					}
				}
		}

		if (unemployedSpecialists.size() < 1)
			return;

		// Remove unemployed specialist
		unemployedSpecialists.remove(0);

		RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
		packet.setContainer(name, name, 1);
		Json json = new Json();
		playerOwner.sendPacket(json.toJson(packet));

		setCitizenTileWorker(new LockedCitizenWorker(this, tile));

		// FIXME: Redundant code w/ removeSpecialist()
		statLine.mergeStatLine(getTileStatLine(tile));

		CityStatUpdatePacket cityStatUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			cityStatUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}

		playerOwner.sendPacket(json.toJson(cityStatUpdatePacket));
		playerOwner.updateOwnedStatlines(false);
	}

	public void addSpecialistToContainer(SpecialistContainer specialistContainer) {
		specialistContainer.addSpecialist();

		AddSpecialistToContainerPacket packet = new AddSpecialistToContainerPacket();
		packet.setContainer(name, specialistContainer.getName(), 1);

		Json json = new Json();
		playerOwner.sendPacket(json.toJson(packet));
	}

	public void removeSpecialistFromContainer(SpecialistContainer specialistContainer) {
		specialistContainer.removeSpecialist();

		RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
		packet.setContainer(name, specialistContainer.getName(), 1);

		Json json = new Json();
		playerOwner.sendPacket(json.toJson(packet));

		playerOwner.updateOwnedStatlines(false);
	}

	public AbstractPlayer getPlayerOwner() {
		return playerOwner;
	}

	public HashMap<Tile, CitizenWorker> getCitizenWorkers() {
		return citizenWorkers;
	}

	public ArrayList<Specialist> getUnemployedSpecialists() {
		return unemployedSpecialists;
	}

	public String getName() {
		return name;
	}

	public void addBuilding(Building building) {
		buildings.add(building);

		BuildingConstructedPacket buildingConstructedPacket = new BuildingConstructedPacket();
		buildingConstructedPacket.setBuildingName(building.getName());
		buildingConstructedPacket.setCityName(name);

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(buildingConstructedPacket));
		}

		statLine.mergeStatLine(building.getStatLine());

		// FIXME: This is not ideal for implementing morale. But we need to update our
		// production modifier through the method
		if (building.getStatLine().hasStatValue(Stat.MORALE)) {
			statLine.subValue(Stat.MORALE, building.getStatLine().getStatValue(Stat.MORALE));
			addMorale(building.getStatLine().getStatValue(Stat.MORALE));
		}

		CityStatUpdatePacket packet = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(name, stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		playerOwner.sendPacket(json.toJson(packet));
	}

	public Tile getOriginTile() {
		return originTile;
	}

	public ArrayList<Tile> getTerritory() {
		return territory;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public ProducibleItemManager getProducibleItemManager() {
		return producibleItemManager;
	}

	public void clickWorkedTile(Tile tile) {
		citizenWorkers.get(tile).onClick();
	}

	public ArrayList<Building> getBuildings() {
		return buildings;
	}

	public void setOwner(AbstractPlayer playerOwner) {
		this.playerOwner = playerOwner;

		producibleItemManager.clearProducingItem();

		// Note: This assumes were being captured.
	}

	public StatLine getTileStatLine(Tile tile) {

		if (tile.equals(originTile)) {

			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 2);
			for (Stat stat : tile.getStatLine().getStatValues().keySet()) {
				if (stat == Stat.FOOD_GAIN)
					continue;
				statLine.setValue(stat, tile.getStatLine().getStatValue(stat));
			}

			if (statLine.getStatValue(Stat.PRODUCTION_GAIN) < 1)
				statLine.setValue(Stat.PRODUCTION_GAIN, 1);

			return statLine;
		}

		StatLine tileStatLine = new StatLine();
		tileStatLine.mergeStatLine(tile.getStatLine());
		for (Building building : buildings) {
			if (building instanceof IncreaseTileStatlineBuilding) {
				IncreaseTileStatlineBuilding statlineBuilding = (IncreaseTileStatlineBuilding) building;

				tileStatLine.mergeStatLine(statlineBuilding.getAddedStatline(tile));
			}
		}

		tileStatLine.subValue(Stat.MORALE, tileStatLine.getStatValue(Stat.MORALE));

		return tileStatLine;
	}

	private ArrayList<Tile> getTopWorkableTiles() {
		ArrayList<Tile> topTiles = new ArrayList<>();

		for (Tile tile : territory) {
			if (tile.equals(originTile)
					|| citizenWorkers.containsKey(tile) && citizenWorkers.get(tile).isValidTileWorker())
				continue;

			topTiles.add(tile);
		}

		// Sort the topTiles based on the tile's value
		for (int i = 1; i < topTiles.size(); i++) {

			int j = i - 1;

			Tile tile = topTiles.get(i);

			int eatenFood = (int) (statLine.getStatValue(Stat.POPULATION) * 2);
			int foodValue = ((statLine.getStatValue(Stat.FOOD_GAIN) - eatenFood) > 1) ? 1 : 6;

			// System.out.println((statLine.getStatValue(Stat.FOOD_GAIN)) + "=" +
			// foodValue);

			float value = getTileStatLine(tile).getStatValue(Stat.FOOD_GAIN) * foodValue
					+ getTileStatLine(tile).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(tile).getStatValue(Stat.PRODUCTION_GAIN) * 3;

			while (j >= 0 && getTileStatLine(topTiles.get(j)).getStatValue(Stat.FOOD_GAIN) * foodValue
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.PRODUCTION_GAIN) * 3 < value) {
				topTiles.set(j + 1, topTiles.get(j));
				j--;
			}

			topTiles.set(j + 1, tile);
		}

		return topTiles;
	}

	private Tile getTopExpansionTile() {
		ArrayList<Tile> topTiles = new ArrayList<>();

		for (Tile tile : territory) {
			for (Tile adjTile : tile.getAdjTiles()) {
				if (adjTile == null || territory.contains(adjTile) || adjTile.getTerritory() != null)
					continue;

				topTiles.add(adjTile);
			}
		}

		// Sort the topTiles based on the tile's value
		for (int i = 1; i < topTiles.size(); i++) {

			int j = i - 1;

			Tile tile = topTiles.get(i);

			// TODO: Include the distance from the city center towards the value.
			float value = (getTileStatLine(tile).getStatValue(Stat.FOOD_GAIN) * 4
					+ getTileStatLine(tile).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(tile).getStatValue(Stat.PRODUCTION_GAIN) * 4)
					- tile.getDistanceFrom(originTile) / 32;

			if (tile.containsTileProperty(TileProperty.LUXURY, TileProperty.RESOURCE))
				value += 4;

			while (j >= 0 && getTileStatLine(topTiles.get(j)).getStatValue(Stat.FOOD_GAIN) * 4
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.PRODUCTION_GAIN) * 4 < value) {
				topTiles.set(j + 1, topTiles.get(j));
				j--;
			}

			topTiles.set(j + 1, tile);
		}

		return topTiles.get(0);
	}

	private void setPopulation(int amount) {
		float popDiff = amount - statLine.getStatValue(Stat.POPULATION);
		statLine.setValue(Stat.POPULATION, amount);
		statLine.setValue(Stat.FOOD_SURPLUS, 0);

		if (amount > 0) {
			Server.getInstance().getEventManager().fireEvent(new CityGrowthEvent(this));
			statLine.addValue(Stat.SCIENCE_GAIN, 0.5F);
			subMorale(5 * popDiff);
		} else {
			Server.getInstance().getEventManager().fireEvent(new CityStarveEvent(this));
			statLine.subValue(Stat.SCIENCE_GAIN, 0.5F);
			addMorale(5 * popDiff);
		}

		playerOwner.updateOwnedStatlines(false);
	}

	public void addMorale(float morale) {
		setMorale(statLine.getStatValue(Stat.MORALE) + morale);
	}

	public void subMorale(float morale) {
		setMorale(statLine.getStatValue(Stat.MORALE) - morale);
	}

	public void setMorale(float morale) {
		// FIXME: Morale can sometimes be > 100 on the first few turns.
		// morale = MathUtils.clamp(morale, 0, 100);
		statLine.setValue(Stat.MORALE, morale);

		float moraleOffset = (morale >= 70 ? (morale - 70) / 100 : (70 - morale) / 100);
		statLine.setModifier(Stat.PRODUCTION_GAIN, moraleOffset);
	}

	public boolean isCoastal() {
		for (Tile tile : originTile.getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				return true;

		return false;
	}

	public <T extends Building> boolean containsBuilding(Class<T> buildingClass) {
		for (Building building : buildings)
			if (building.getClass() == buildingClass)
				return true;

		return false;
	}

	private int getCitizenWorkerAmountOfType(WorkerType workerType) {
		int amount = 0;
		for (CitizenWorker citizenWorker : citizenWorkers.values()) {
			if (citizenWorker.getWorkerType() == workerType)
				amount++;
		}

		return amount;
	}
}
