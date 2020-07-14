package me.rhin.openciv.server.game.city;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Random;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.production.ProducibleItemManager;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.RemoveWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.SetWorkedTilePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class City {

	private Player playerOwner;
	private String name;
	private Tile originTile;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private ArrayList<Tile> workedTiles;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;

	public City(Player playerOwner, String name, Tile originTile) {
		this.playerOwner = playerOwner;
		this.name = name;
		this.originTile = originTile;
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.workedTiles = new ArrayList<>();
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();

		for (Tile adjTile : originTile.getAdjTiles()) {
			territory.add(adjTile);
		}
		territory.add(originTile);
		originTile.setCity(this);

		statLine.setValue(Stat.POPULATION, 1);
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

	public void updateWorkedTiles() {
		ArrayList<Tile> topTiles = new ArrayList<>();

		float maxValue = -1;

		for (Tile tile : territory) {
			if (tile.equals(originTile))
				continue;
			float value = getTileStatLine(tile).getStatValue(Stat.FOOD_GAIN) * 3
					+ getTileStatLine(tile).getStatValue(Stat.GOLD_GAIN) * 2
					+ getTileStatLine(tile).getStatValue(Stat.PRODUCTION_GAIN) * 1;

			if (value > maxValue) {
				topTiles.add(0, tile);
				maxValue = value;
			}
		}

		for (Tile tile : new ArrayList<>(workedTiles)) {
			removeWorkedTile(tile);
		}

		setWorkedTile(null, originTile);

		for (int i = 0; i < statLine.getStatValue(Stat.POPULATION); i++) {
			Tile tile = topTiles.get(i);
			setWorkedTile(null, tile);
		}
	}

	public Player getPlayerOwner() {
		return playerOwner;
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

	private void setWorkedTile(Tile prevTile, Tile workedTile) {
		if (prevTile != null) {
			removeWorkedTile(prevTile);
		}

		workedTiles.add(workedTile);
		statLine.mergeStatLine(getTileStatLine(workedTile));

		SetWorkedTilePacket workedTilePacket = new SetWorkedTilePacket();
		workedTilePacket.setTile(getName(), workedTile.getGridX(), workedTile.getGridY());
		Json json = new Json();
		playerOwner.getConn().send(json.toJson(workedTilePacket));

		CityStatUpdatePacket statUpdatePacket = new CityStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			statUpdatePacket.addStat(name, stat.name(), this.statLine.getStatValues().get(stat));
		}
		playerOwner.getConn().send(json.toJson(statUpdatePacket));
	}

	private void removeWorkedTile(Tile tile) {
		workedTiles.remove(tile);
		RemoveWorkedTilePacket packet = new RemoveWorkedTilePacket();
		packet.setTile(getName(), tile.getGridX(), tile.getGridY());
		Json json = new Json();
		playerOwner.getConn().send(json.toJson(packet));
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
}
