package me.rhin.openciv.shared.packet;

import java.util.HashMap;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

public abstract class Packet implements Json.Serializable {

	protected String packetName;

	public Packet() {
		this.packetName = getClass().getName();
	}

	@Override
	public void write(Json json) {
		json.writeValue("packetName", packetName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		this.packetName = jsonData.getString("packetName");
	}

	public String getPacketName() {
		return packetName;
	}
}
