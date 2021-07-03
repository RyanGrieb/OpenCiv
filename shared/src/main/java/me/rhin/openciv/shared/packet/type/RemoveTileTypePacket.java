package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class RemoveTileTypePacket extends Packet {

	private String tileType;
	private int gridX, gridY;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("tileType", tileType);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tileType = jsonData.getString("tileType");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setTile(String tileType, int gridX, int gridY) {
		this.tileType = tileType;
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public String getTileTypeName() {
		return tileType;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

}
