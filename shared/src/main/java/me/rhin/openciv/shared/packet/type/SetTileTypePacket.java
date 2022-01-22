package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetTileTypePacket extends Packet {

	private String tileType;
	private int gridX, gridY;
	private boolean clearTileTypes;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("tileType", tileType);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
		json.writeValue("clearTileTypes", clearTileTypes);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tileType = jsonData.getString("tileType");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
		this.clearTileTypes = jsonData.getBoolean("clearTileTypes");
	}

	public void setTile(String tileType, int gridX, int gridY) {
		this.tileType = tileType;
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public boolean isClearTileTypes() {
		return clearTileTypes;
	}

	public void setClearTileTypes(boolean clearTileTypes) {
		this.clearTileTypes = clearTileTypes;
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
