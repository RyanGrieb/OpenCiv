package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class TradeCityPacket extends Packet {

	private int unitGridX, unitGridY;
	private int unitID;
	private String cityName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("unitID", unitID);
		json.writeValue("unitGridX", unitGridX);
		json.writeValue("unitGridY", unitGridY);
		json.writeValue("cityName", cityName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.unitGridX = jsonData.getInt("unitGridX");
		this.unitGridY = jsonData.getInt("unitGridY");
		this.cityName = jsonData.getString("cityName");
		this.unitID = jsonData.getInt("unitID");
	}

	public void setCity(String cityName, int unitID, int unitGridX, int unitGridY) {
		this.cityName = cityName;
		this.unitID = unitID;
		this.unitGridX = unitGridX;
		this.unitGridY = unitGridY;
	}

	public int getUnitID() {
		return unitID;
	}

	public String getCityName() {
		return cityName;
	}

	public int getUnitGridX() {
		return unitGridX;
	}

	public int getUnitGridY() {
		return unitGridY;
	}
}