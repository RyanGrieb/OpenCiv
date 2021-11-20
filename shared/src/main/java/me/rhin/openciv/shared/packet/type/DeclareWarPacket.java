package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class DeclareWarPacket extends Packet {

	private String attacker, defender;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("attacker", attacker);
		json.writeValue("defender", defender);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.attacker = jsonData.getString("attacker");
		this.defender = jsonData.getString("defender");
	}

	public void setCombatants(String attacker, String defender) {
		this.attacker = attacker;
		this.defender = defender;
	}

	public String getAttacker() {
		return attacker;
	}

	public String getDefender() {
		return defender;
	}
}
