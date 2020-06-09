package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PlayerConnectPacket extends Packet {

	private String playerName;

	public PlayerConnectPacket() {
		super(PlayerConnectPacket.class.getName());
	}

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public String getPlayerName() {
		return playerName;
	}

	@Override
	public void write(Json json) {
		json.writeValue("packetName", packetName);
		json.writeValue("playerName", playerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		this.packetName = jsonData.getString("packetName");
		this.playerName = jsonData.getString("playerName");
	}
}
