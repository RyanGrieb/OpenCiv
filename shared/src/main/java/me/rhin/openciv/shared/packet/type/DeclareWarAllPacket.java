package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class DeclareWarAllPacket extends Packet {

	private String attacker;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("attacker", attacker);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.attacker = jsonData.getString("attacker");
	}

	public void setCombatant(String attacker) {
		this.attacker = attacker;
	}

	public String getAttacker() {
		return attacker;
	}
}