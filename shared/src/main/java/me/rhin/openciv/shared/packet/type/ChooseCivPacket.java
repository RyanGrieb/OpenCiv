package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ChooseCivPacket extends Packet {

	private String civName;
	private String playerName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("civName", civName);
		json.writeValue("playerName", playerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.civName = jsonData.getString("civName");
		this.playerName = jsonData.getString("playerName");
	}

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public void setCivName(String civName) {
		this.civName = civName;
	}

	public String getPlayerName() {
		return playerName;
	}

	public String getCivName() {
		return civName;
	}
}
