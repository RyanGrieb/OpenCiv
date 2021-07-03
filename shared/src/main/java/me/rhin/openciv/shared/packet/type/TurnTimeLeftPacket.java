package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class TurnTimeLeftPacket extends Packet {

	private int time;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("time", time);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.time = jsonData.getInt("time");
	}

	public void setTime(int time) {
		this.time = time;
	}

	public int getTime() {
		return time;
	}

}
