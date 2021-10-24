package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;
import me.rhin.openciv.shared.packet.StatPacket;

public class TileStatlinePacket extends Packet implements StatPacket {

	private int gridX, gridY;
	private static final int MAX_STATS = 12;

	private String[] statNames;
	private float[] statValues;

	public TileStatlinePacket() {
		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
		json.writeValue("statNames", statNames);
		json.writeValue("statValues", statValues);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");

		this.statNames = new String[MAX_STATS];
		this.statValues = new float[MAX_STATS];

		statNames = jsonData.get("statNames").asStringArray();
		statValues = jsonData.get("statValues").asFloatArray();
	}

	@Override
	public String[] getStatNames() {
		return statNames;
	}

	@Override
	public float[] getStatValues() {
		return statValues;
	}

	public void setTile(int gridX, int gridY) {
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
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
