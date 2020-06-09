package me.rhin.openciv.shared.packet.type;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PlayerListRequestPacket extends Packet {

	// FIXME: We should be able to change the lobby size.
	private static final int MAX_PLAYERS = 12;

	private String[] playerList;

	public PlayerListRequestPacket() {
		super(PlayerListRequestPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		json.writeValue("packetName", packetName);
		json.writeValue("playerNames", playerList);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		this.packetName = jsonData.getString("packetName");
		this.playerList = new String[MAX_PLAYERS];

		if (!jsonData.hasChild("playerNames"))
			return;

		for (int i = 0; i < jsonData.get("playerNames").asStringArray().length; i++) {
			playerList[i] = jsonData.get("playerNames").asStringArray()[i];
		}

	}

	public void addPlayer(String name) {
		for (int i = 0; i < MAX_PLAYERS; i++) {
			if (playerList[i] == null) {
				playerList[i] = name;
				break;
			}
		}
	}

	public String[] getPlayerList() {
		return playerList;
	}
}
