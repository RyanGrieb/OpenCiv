package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class FetchPlayerPacket extends Packet {

	private String playerName;

	public FetchPlayerPacket() {
		super(FetchPlayerPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerName", playerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerName = jsonData.getString("playerName");
	}

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public String getPlayerName() {
		return playerName;
	}
}
