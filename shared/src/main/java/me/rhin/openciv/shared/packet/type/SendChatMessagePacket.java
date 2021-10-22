package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SendChatMessagePacket extends Packet {

	private String playerName;
	private String message;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerName", playerName);
		json.writeValue("message", message);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerName = jsonData.getString("playerName");
		this.message = jsonData.getString("message");
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public String getPlayerName() {
		return playerName;
	}

	public String getMessage() {
		return message;
	}
}
