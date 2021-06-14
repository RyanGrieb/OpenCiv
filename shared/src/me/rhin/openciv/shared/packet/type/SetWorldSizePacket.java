package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetWorldSizePacket extends Packet {

	private int worldSize;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("worldSize", worldSize);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.worldSize = jsonData.getInt("worldSize");
	}

	public void setWorldSize(int worldSize) {
		this.worldSize = worldSize;
	}

	public int getWorldSize() {
		return worldSize;
	}
}
