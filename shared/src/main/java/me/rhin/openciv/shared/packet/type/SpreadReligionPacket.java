package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SpreadReligionPacket extends Packet {

	private int unitID;
	private int gridX, gridY;
	private String cityName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("unitID", unitID);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
		json.writeValue("cityName", cityName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.unitID = jsonData.getInt("unitID");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
		this.cityName = jsonData.getString("cityName");
	}

	public void setSpreadTarget(int unitID, int gridX, int gridY, String cityName) {
		this.unitID = unitID;
		this.gridX = gridX;
		this.gridY = gridY;
		this.cityName = cityName;
	}

	public int getUnitID() {
		return unitID;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public String getCityName() {
		return cityName;
	}

}
