package me.rhin.openciv.server.game.city;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

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
import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class City implements SpecialistContainer {

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

		for (Tile adjTile : originTile.getAdjTiles()) {
			territory.add(adjTile);
		}
		territory.add(originTile);
		originTile.setCity(this);

		setPopulation(1);
		// NOTE: We don't need to send a stat update packet here. So we dont.
		playerOwner.getStatLine().mergeStatLine(statLine);
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
		setCitizenTileWorker(new AssignedCitizenWorker(this, topTiles.get(0)));

		statLine.mergeStatLine(topTiles.get(0).getStatLine());

		Json json = new Json();

		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(statUpdatePacket));
	}

	public void updateWorkedTiles() {
		ArrayList<Tile> topTiles = getTopWorkableTiles();
		unemployedSpecialists.clear();
		citizenWorkers.clear();

		for (Tile tile : territory) {
			// TODO: Ensure the tile is within 3 tiles of the city
			setCitizenTileWorker(new EmptyCitizenWorker(this, tile));
		}

		setCitizenTileWorker(new CityCenterCitizenWorker(this, originTile));

		for (int i = 0; i < statLine.getStatValue(Stat.POPULATION); i++) {
			Tile tile = topTiles.get(i);
			setCitizenTileWorker(new AssignedCitizenWorker(this, tile));
		}

		for (CitizenWorker citizenWorker : citizenWorkers.values()) {
			if (citizenWorker.isValidTileWorker()) {
				statLine.mergeStatLine(getTileStatLine(citizenWorker.getTile()));
			}
		}

		Json json = new Json();

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

		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}

		SetCitizenTileWorkerPacket tileWorkerPacket = new SetCitizenTileWorkerPacket();
		tileWorkerPacket.setWorker(emptyCitizenWorker.getWorkerType(), name, emptyCitizenWorker.getTile().getGridX(),
				emptyCitizenWorker.getTile().getGridY());

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(tileWorkerPacket));
		playerOwner.getConn().send(json.toJson(statUpdatePacket));

		addSpecialistToContainer(this);
	}

	public void addSpecialistToContainer(SpecialistContainer specialistContainer) {
		specialistContainer.addSpecialist();

		AddSpecialistToContainerPacket packet = new AddSpecialistToContainerPacket();
		packet.setContainer(name, specialistContainer.getName());

		Json json = new Json();
		playerOwner.getConn().send(json.toJson(packet));
	}

	public void removeSpecialistFromContainer(SpecialistContainer specialistContainer) {
		specialistContainer.removeSpecialist();

		RemoveSpecialistFromContainerPacket packet = new RemoveSpecialistFromContainerPacket();
		packet.setContainer(name, specialistContainer.getName());

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
		for (Player player : Server.getInstance().getGame().getPlayers()) {
			player.getConn().send(json.toJson(buildingConstructedPacket));
		}

		statLine.mergeStatLine(building.getStatLine());

		CityStatUpdatePacket packet = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(packet));

		playerOwner.mergeStatLine(building.getStatLine());
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

	private StatLine getTileStatLine(Tile tile) {
		// TODO: Research, religion can effect the output of tiles.

		if (tile.equals(originTile)) {
			for (TileTypeWrapper type : originTile.getTileTypeWrappers()) {
				System.out.println(type);
			}
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

		float maxValue = -1;

		for (Tile tile : territory) {
			if (tile.equals(originTile)
					|| (citizenWorkers.containsKey(tile) && citizenWorkers.get(tile).isValidTileWorker()))
				continue;
			float value = getTileStatLine(tile).getStatValue(Stat.FOOD_GAIN) * 3
					+ getTileStatLine(tile).getStatValue(Stat.GOLD_GAIN) * 2
					+ getTileStatLine(tile).getStatValue(Stat.PRODUCTION_GAIN) * 1;

			if (value > maxValue) {
				topTiles.add(0, tile);
				maxValue = value;
			}
		}

		return topTiles;
	}

	private void setPopulation(int amount) {
		statLine.setValue(Stat.POPULATION, amount);
		statLine.setValue(Stat.FOOD_GAIN,
				statLine.getStatValue(Stat.FOOD_GAIN) - statLine.getStatValue(Stat.POPULATION) * 2);
	}
}
