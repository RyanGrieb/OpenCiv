package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class CityReligionFollowersUpdatePacket extends Packet {

	public static final int MAX_RELIGIONS = 8;

	private String cityName;
	private String[] playerNames;
	private int[] followers;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("playerNames", playerNames);
		json.writeValue("followers", followers);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerNames = new String[MAX_RELIGIONS];
		this.followers = new int[MAX_RELIGIONS];

		cityName = jsonData.get("cityName").asString();
		playerNames = jsonData.get("playerNames").asStringArray();
		followers = jsonData.get("followers").asIntArray();
	}

	public void setCityName(String cityName) {
		this.cityName = cityName;
	}

	// Note: playerName is the player's religion
	public void addFollowerGroup(String playerName, int amount) {

		if (playerNames == null)
			this.playerNames = new String[MAX_RELIGIONS];

		if (followers == null)
			this.followers = new int[MAX_RELIGIONS];

		for (int i = 0; i < MAX_RELIGIONS; i++) {
			if (playerNames[i] == null) {
				playerNames[i] = playerName;
				followers[i] = amount;
				break;
			}
		}
	}

	public String[] getPlayerNames() {
		return playerNames;
	}

	public int[] getFollowers() {
		return followers;
	}

	public String getCityName() {
		return cityName;
	}

}
