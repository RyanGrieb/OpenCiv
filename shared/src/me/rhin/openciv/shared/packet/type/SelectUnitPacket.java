package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SelectUnitPacket extends Packet {

	private int unitID;
	private int gridX, gridY;

	public SelectUnitPacket() {
		super(SelectUnitPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("unitID", unitID);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.unitID = jsonData.getInt("unitID");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setUnitID(int unitID) {
		this.unitID = unitID;
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

	public int getUnitID() {
		return unitID;
	}
}
