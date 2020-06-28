package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class CityStatUpdatePacket extends Packet {
	private static final int MAX_STATS = 12;

	private String cityName;
	private String[] statNames;
	private float[] statValues;

	public CityStatUpdatePacket() {
		super(CityStatUpdatePacket.class.getName());

		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("statNames", statNames);
		json.writeValue("statValues", statValues);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];

		cityName = jsonData.getString("cityName");
		statNames = jsonData.get("statNames").asStringArray();
		statValues = jsonData.get("statValues").asFloatArray();
	}

	public String getCityName() {
		return cityName;
	}

	public String[] getStatNames() {
		return statNames;
	}

	public float[] getStatValues() {
		return statValues;
	}

	public void addStat(String cityName, String statName, float statValue) {
		this.cityName = cityName;
		for (int i = 0; i < MAX_STATS; i++) {
			if (statNames[i] == null) {
				statNames[i] = statName;
				statValues[i] = statValue;
				break;
			}
		}
	}
}
