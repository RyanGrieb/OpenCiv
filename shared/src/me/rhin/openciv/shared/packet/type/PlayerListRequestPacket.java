package me.rhin.openciv.shared.packet.type;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PlayerListRequestPacket extends Packet {

	// FIXME: We should be able to change the lobby size.
	private static final int MAX_PLAYERS = 12;

	private String[] playerList;
	private String[] civList;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerNames", playerList);
		json.writeValue("civList", civList);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerList = new String[MAX_PLAYERS];
		this.civList = new String[MAX_PLAYERS];

		if (!jsonData.hasChild("playerNames"))
			return;

		// FIXME: Just the the playerList to the String array?
		// for (int i = 0; i < jsonData.get("playerNames").asStringArray().length; i++)
		// {
		// playerList[i] = jsonData.get("playerNames").asStringArray()[i];
		// }
		playerList = jsonData.get("playerNames").asStringArray();
		civList = jsonData.get("civList").asStringArray();
	}

	public void addPlayer(String name, String civName) {
		for (int i = 0; i < MAX_PLAYERS; i++) {
			if (playerList[i] == null) {
				playerList[i] = name;
				civList[i] = civName;
				break;
			}
		}
	}

	public String[] getPlayerList() {
		return playerList;
	}

	public String[] getCivList() {
		return civList;
	}
}
