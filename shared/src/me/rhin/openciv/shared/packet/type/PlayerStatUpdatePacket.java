package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PlayerStatUpdatePacket extends Packet {

	private static final int MAX_STATS = 12;

	private String[] statNames;
	private float[] statValues;

	public PlayerStatUpdatePacket() {
		super(PlayerStatUpdatePacket.class.getName());

		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("statNames", statNames);
		json.writeValue("statValues", statValues);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];

		statNames = jsonData.get("statNames").asStringArray();
		statValues = jsonData.get("statValues").asFloatArray();
	}

	public String[] getStatNames() {
		return statNames;
	}

	public float[] getStatValues() {
		return statValues;
	}

	public void addStat(String statName, float statValue) {
		for (int i = 0; i < MAX_STATS; i++) {
			if (statNames[i] == null) {
				statNames[i] = statName;
				statValues[i] = statValue;
				break;
			}
		}
	}
}
