package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ClickWorkedTilePacket extends Packet {

	private String cityName;
	private int gridX, gridY;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setTile(String cityName, int gridX, int gridY) {
		this.cityName = cityName;
		this.gridX = gridX;
		this.gridY = gridY;
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
