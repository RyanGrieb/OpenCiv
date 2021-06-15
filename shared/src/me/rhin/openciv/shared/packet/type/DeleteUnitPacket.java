package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class DeleteUnitPacket extends Packet {

	int tileGridX, tileGridY;
	private int unitID;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("tileGridX", tileGridX);
		json.writeValue("tileGridY", tileGridY);
		json.writeValue("unitID", unitID);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tileGridX = jsonData.getInt("tileGridX");
		this.tileGridY = jsonData.getInt("tileGridY");
		this.unitID = jsonData.getInt("unitID");
	}

	public void setUnit(int unitID, int tileGridX, int tileGridY) {
		this.tileGridX = tileGridX;
		this.tileGridY = tileGridY;
		this.unitID = unitID;
	}

	public int getTileGridX() {
		return tileGridX;
	}

	public int getTileGridY() {
		return tileGridY;
	}

	public int getUnitID() {
		return unitID;
	}
}
