package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SelectUnitPacket extends Packet {

	private String unitName;
	private int gridX, gridY;

	public SelectUnitPacket() {
		super(SelectUnitPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("unitName", unitName);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.unitName = jsonData.getString("unitName");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setUnitName(String unitName) {
		this.unitName = unitName;
	}

	public void setLocation(int gridX, int gridY) {
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public String getUnitName() {
		return unitName;
	}
}
