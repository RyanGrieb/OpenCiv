package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PlayerConnectPacket extends Packet {

	private String playerName;
	private String color;

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public void setColor(String color) {
		this.color = color;
	}

	public String getPlayerName() {
		return playerName;
	}

	public String getColorHex() {
		return color;
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerName", playerName);
		json.writeValue("color", color);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerName = jsonData.getString("playerName");
		this.color = jsonData.getString("color");
	}
}
