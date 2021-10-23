package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class WorkTilePacket extends Packet {

	private String improvementType;
	private int gridX, gridY;
	private int unitID;
	private int appliedTurns;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("improvementType", improvementType);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
		json.writeValue("unitID", unitID);
		json.writeValue("appliedTurns", appliedTurns);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.improvementType = jsonData.getString("improvementType");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
		this.unitID = jsonData.getInt("unitID");
		this.appliedTurns = jsonData.getInt("appliedTurns");
	}

	public void setTile(String improvementType, int unitID, int gridX, int gridY) {
		this.improvementType = improvementType;
		this.gridX = gridX;
		this.gridY = gridY;
		this.appliedTurns = 0;
		this.unitID = unitID;
	}

	public void setTile(String improvementType, int gridX, int gridY, int appliedTurns, int unitID) {
		this.improvementType = improvementType;
		this.gridX = gridX;
		this.gridY = gridY;
		this.appliedTurns = appliedTurns;
		this.unitID = unitID;
	}

	public String getImprovementType() {
		return improvementType;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public int getAppliedTurns() {
		return appliedTurns;
	}

	public int getUnitID() {
		return unitID;
	}
}
