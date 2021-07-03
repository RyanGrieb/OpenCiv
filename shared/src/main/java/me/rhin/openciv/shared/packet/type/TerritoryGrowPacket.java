package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class TerritoryGrowPacket extends Packet {

	private int gridX, gridY;
	private String playerOwner;
	private String cityName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerOwner", playerOwner);
		json.writeValue("cityName", cityName);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerOwner = jsonData.getString("playerOwner");
		this.cityName = jsonData.getString("cityName");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setLocation(int gridX, int gridY) {
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public void setOwner(String playerOwner) {
		this.playerOwner = playerOwner;
	}

	public void setCityName(String cityName) {
		this.cityName = cityName;
	}

	public String getPlayerOwner() {
		return playerOwner;
	}

	public String getCityName() {
		return cityName;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}
}
