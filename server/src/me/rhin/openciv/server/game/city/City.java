package me.rhin.openciv.server.game.city;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.citizen.AssignedCitizenWorker;
import me.rhin.openciv.server.game.city.citizen.CitizenWorker;
import me.rhin.openciv.server.game.city.citizen.CityCenterCitizenWorker;
import me.rhin.openciv.server.game.city.citizen.EmptyCitizenWorker;
import me.rhin.openciv.server.game.city.specialist.Specialist;
import me.rhin.openciv.server.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.server.game.city.specialist.UnemployedSpecialist;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.server.game.unit.AttackableEntity;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.util.MathHelper;

public class City implements AttackableEntity, SpecialistContainer, NextTurnListener {

	private Player playerOwner;
	private String name;
	private Tile originTile;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private HashMap<Tile, CitizenWorker> citizenWorkers;
	// FIXME: I don't believe we need an array here, we might be able to use just an
	// int.
	private ArrayList<Specialist> unemployedSpecialists;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;
	private float health;

	public City(Player playerOwner, String name, Tile originTile) {
		this.playerOwner = playerOwner;
		this.name = name;
		this.originTile = originTile;
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.citizenWorkers = new HashMap<>();
		this.unemployedSpecialists = new ArrayList<>();
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();
		this.health = 200;

		for (Tile adjTile : originTile.getAdjTiles()) {
			territory.add(adjTile);
		}

		territory.add(originTile);
		originTile.setCity(this);

		for (Tile tile : territory) {
			citizenWorkers.put(tile, new EmptyCitizenWorker(this, tile));
		}

		setPopulation(1);
		statLine.setValue(Stat.EXPANSION_REQUIREMENT, 10 + 10 * (float) Math.pow(territory.size() - 6, 1.3));
		// Add our two specialists, one from pop, one city center
		addSpecialist();
		addSpecialist();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	public static String getRandomCityName() {
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

		statLine.mergeStatLine(topTile.getStatLine());

		Json json = new Json();

		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(statUpdatePacket));
		
		//!!! Update player 
	}

	@Override
	public void onNextTurn() {
		if (playerOwner.getConn().isClosed() || playerOwner.getConn().isClosing())
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
			EmptyCitizenWorker citizenWorker = new EmptyCitizenWorker(this, expansionTile);
			citizenWorkers.put(expansionTile, citizenWorker);

			Json json = new Json();
			for (Player player : Server.getInstance().getPlayers()) {
				TerritoryGrowPacket territoryGrowPacket = new TerritoryGrowPacket();
				territoryGrowPacket.setCityName(name);
				territoryGrowPacket.setLocation(expansionTile.getGridX(), expansionTile.getGridY());
				territoryGrowPacket.setOwner(playerOwner.getName());
				player.getConn().send(json.toJson(territoryGrowPacket));
			}

			// FIXME: Have the client automatically add an empty citizen...
			SetCitizenTileWorkerPacket setTileWorkerPacket = new SetCitizenTileWorkerPacket();
			setTileWorkerPacket.setWorker(citizenWorker.getWorkerType(), name, citizenWorker.getTile().getGridX(),
					citizenWorker.getTile().getGridY());

			playerOwner.getConn().send(json.toJson(setTileWorkerPacket));

			int tiles = territory.size() - 6;
			statLine.setValue(Stat.EXPANSION_REQUIREMENT, 10 + 10 * (float) Math.pow(tiles, 1.3));

			updateWorkedTiles();
		}

		Json json = new Json();
		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}

		playerOwner.getConn().send(json.toJson(statUpdatePacket));

		if (health < getMaxHealth()) {
			health = MathUtils.clamp(health + 5, 0, getMaxHealth());
		}
	}

	@Override
	public int getCombatStrength() {
		return 5;
	}

	@Override
	public boolean isUnitCapturable() {
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
	public float getDamageTaken(AttackableEntity otherEntity) {
		return (float) (30 * (Math.pow(1.041, otherEntity.getCombatStrength() - getCombatStrength())));
	}

	@Override
	public boolean surviveAttack(AttackableEntity otherEntity) {
		return health - getDamageTaken(otherEntity) > 0;
	}

	public int getMaxHealth() {
		return 200;
	}

	public void updateWorkedTiles() {

		// Make all citizens unemployed
		for (Tile tile : territory) {
			CitizenWorker citizenWorker = citizenWorkers.get(tile);
			if (citizenWorker.isValidTileWorker()) {
				statLine.reduceStatLine(getTileStatLine(citizenWorker.getTile()));
				addSpecialist();
			}

			setCitizenTileWorker(new EmptyCitizenWorker(this, citizenWorker.getTile()));
		}

		// TODO: Remove all specialists from buildings

		// Go through the city population, and assign a worker from our unemployed
		// specialist

		ArrayList<Tile> topTiles = getTopWorkableTiles();

		for (int i = 0; i < statLine.getStatValue(Stat.POPULATION); i++) {
			Tile tile = topTiles.get(i);
			if (citizenWorkers.containsKey(tile) && citizenWorkers.get(tile).isValidTileWorker())
				continue;

			// FIXME: This is slow, have bulk packets in the future
			setCitizenTileWorker(new AssignedCitizenWorker(this, tile));
			unemployedSpecialists.remove(0);
		}

		setCitizenTileWorker(new CityCenterCitizenWorker(this, originTile));
		unemployedSpecialists.remove(0);

		// Clear the assigned unemployed specialists.

		// Assume we lost a citizen, and remove a specialist here. (For starving cities)
		if (unemployedSpecialists.size() > 0) {

			// FIXME: This is a workaround to avoid send an unnecessary packet from
			// removeSpecialistFromContainer()

			RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
			packet.setContainer(name, name, -1);

			Json json = new Json();
			playerOwner.getConn().send(json.toJson(packet));
		}

		unemployedSpecialists.clear();

		// Apply the new stat values for our worked tiles
		for (CitizenWorker citizenWorker : citizenWorkers.values()) {
			if (citizenWorker.isValidTileWorker()) {
				statLine.mergeStatLine(getTileStatLine(citizenWorker.getTile()));
			}
		}

		Json json = new Json();

		// Update city statline
		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(statUpdatePacket));
	}

	public void setCitizenTileWorker(CitizenWorker citizenWorker) {
		citizenWorkers.put(citizenWorker.getTile(), citizenWorker);

		SetCitizenTileWorkerPacket packet = new SetCitizenTileWorkerPacket();
		packet.setWorker(citizenWorker.getWorkerType(), name, citizenWorker.getTile().getGridX(),
				citizenWorker.getTile().getGridY());

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(packet));
	}

	public void removeCitizenWorkerFromTile(Tile tile) {
		CitizenWorker emptyCitizenWorker = new EmptyCitizenWorker(this, tile);
		citizenWorkers.put(tile, emptyCitizenWorker);

		statLine.reduceStatLine(tile.getStatLine());

		CityStatUpdatePacket cityStatUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			cityStatUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}

		SetCitizenTileWorkerPacket tileWorkerPacket = new SetCitizenTileWorkerPacket();
		tileWorkerPacket.setWorker(emptyCitizenWorker.getWorkerType(), name, emptyCitizenWorker.getTile().getGridX(),
				emptyCitizenWorker.getTile().getGridY());

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(tileWorkerPacket));
		playerOwner.getConn().send(json.toJson(cityStatUpdatePacket));

		addSpecialistToContainer(this);
	}

	public void addSpecialistToContainer(SpecialistContainer specialistContainer) {
		specialistContainer.addSpecialist();

		AddSpecialistToContainerPacket packet = new AddSpecialistToContainerPacket();
		packet.setContainer(name, specialistContainer.getName(), 1);

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(packet));
	}

	public void removeSpecialistFromContainer(SpecialistContainer specialistContainer) {
		specialistContainer.removeSpecialist();

		RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
		packet.setContainer(name, specialistContainer.getName(), 1);

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(packet));
	}

	public Player getPlayerOwner() {
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
			player.getConn().send(json.toJson(buildingConstructedPacket));
		}

		statLine.mergeStatLine(building.getStatLine());

		CityStatUpdatePacket packet = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(packet));
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

	public void setOwner(Player playerOwner) {
		this.playerOwner = playerOwner;
	}

	private StatLine getTileStatLine(Tile tile) {
		// TODO: Research, religion can effect the output of tiles.

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
		return tile.getStatLine();
	}

	private ArrayList<Tile> getTopWorkableTiles() {
		ArrayList<Tile> topTiles = new ArrayList<>();

		for (Tile tile : territory) {
			if (tile.equals(originTile))
				continue;

			topTiles.add(tile);
		}

		// Sort the topTiles based on the tile's value
		for (int i = 1; i < topTiles.size(); i++) {

			int j = i - 1;

			Tile tile = topTiles.get(i);

			float value = getTileStatLine(tile).getStatValue(Stat.FOOD_GAIN) * 4
					+ getTileStatLine(tile).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(tile).getStatValue(Stat.PRODUCTION_GAIN) * 1;

			while (j >= 0 && getTileStatLine(topTiles.get(j)).getStatValue(Stat.FOOD_GAIN) * 4
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.GOLD_GAIN) * 1
					+ getTileStatLine(topTiles.get(j)).getStatValue(Stat.PRODUCTION_GAIN) * 1 < value) {
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
				if (territory.contains(adjTile))
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
		statLine.setValue(Stat.POPULATION, amount);
		statLine.setValue(Stat.FOOD_SURPLUS, 0);

		if (amount > 0)
			statLine.addValue(Stat.SCIENCE_GAIN, 0.5F);
		else
			statLine.subValue(Stat.SCIENCE_GAIN, 0.5F);
	}

	public boolean isCoastal() {
		for (Tile tile : originTile.getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				return true;

		return false;
	}
}
