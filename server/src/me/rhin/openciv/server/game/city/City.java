package me.rhin.openciv.server.game.city;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.game.Player;

public class City {

	private Player playerOwner;
	private String name;

	public City(Player playerOwner, String name) {
		this.playerOwner = playerOwner;
		this.name = name;
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
}
