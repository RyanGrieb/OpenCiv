package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class TurnTickPacket extends Packet {

	private int tickTime;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("tickTime", tickTime);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tickTime = jsonData.getInt("tickTime");
	}

	public void setTime(int time) {
		this.tickTime = time;
	}

	public int getTime() {
		return tickTime;
	}

}
