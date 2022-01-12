package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class DiscoveredPlayerPacket extends Packet {

	private String playerName, discoveredPlayerName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerName", playerName);
		json.writeValue("discoveredPlayerName", discoveredPlayerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerName = jsonData.getString("playerName");
		this.discoveredPlayerName = jsonData.getString("discoveredPlayerName");
	}

	public void setPlayers(String playerName, String discoveredPlayerName) {
		this.playerName = playerName;
		this.discoveredPlayerName = discoveredPlayerName;
	}

	public String getPlayerName() {
		return playerName;
	}

	public String getDiscoveredPlayerName() {
		return discoveredPlayerName;
	}

}
