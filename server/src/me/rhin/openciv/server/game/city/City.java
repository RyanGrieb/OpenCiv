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
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;

public class City {

	private Player playerOwner;
	private String name;
	private ArrayList<Building> buildings;

	public City(Player playerOwner, String name) {
		this.playerOwner = playerOwner;
		this.name = name;
		buildings = new ArrayList<>();
	}

	public static String getRandomCityName() {
		ArrayList<String> names = new ArrayList<>();
		BufferedReader reader;
		try {
			reader = new BufferedReader(new FileReader("data/cityNames.txt"));
			String line = reader.readLine();
			while (line != null) {
				line = reader.readLine();
				names.add(line);
			}
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		Random rnd = new Random();

		return names.get(rnd.nextInt(names.size()));
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
	}
}
