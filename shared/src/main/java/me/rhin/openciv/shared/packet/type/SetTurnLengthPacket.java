package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetTurnLengthPacket extends Packet {

	private int turnLengthOffset;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("turnLengthOffset", turnLengthOffset);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.turnLengthOffset = jsonData.getInt("turnLengthOffset");
	}

	public void setTurnLengthOffset(int turnLengthOffset) {
		this.turnLengthOffset = turnLengthOffset;
	}

	public int getTurnLengthOffset() {
		return turnLengthOffset;
	}
}
