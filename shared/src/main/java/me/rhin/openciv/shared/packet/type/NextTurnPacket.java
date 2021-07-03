package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class NextTurnPacket extends Packet {

	private int turnTime;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("turnTime", turnTime);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.turnTime = jsonData.getInt("turnTime");
	}

	public void setTurnTime(int turnTime) {
		this.turnTime = turnTime;
	}

	public int getTurnTime() {
		return turnTime;
	}
}
