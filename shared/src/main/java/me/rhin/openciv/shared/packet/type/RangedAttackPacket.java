package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class RangedAttackPacket extends Packet {

	private int unitGridX, unitGridY;
	private int targetGridX, targetGridY;
	private int unitID, targetID;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("targetGridX", targetGridX);
		json.writeValue("targetGridY", targetGridY);
		json.writeValue("unitGridX", unitGridX);
		json.writeValue("unitGridY", unitGridY);
		json.writeValue("unitID", unitID);
		json.writeValue("targetID", targetID);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.targetGridX = jsonData.getInt("targetGridX");
		this.targetGridY = jsonData.getInt("targetGridY");
		this.unitGridX = jsonData.getInt("unitGridX");
		this.unitGridY = jsonData.getInt("unitGridY");
		this.unitID = jsonData.getInt("unitID");
		this.targetID = jsonData.getInt("targetID");
	}

	public void setUnit(int unitID, int unitGridX, int unitGridY) {
		this.unitID = unitID;
		this.unitGridX = unitGridX;
		this.unitGridY = unitGridY;
	}

	public void setTargetEntity(int targetGridX, int targetGridY) {
		this.targetGridX = targetGridX;
		this.targetGridY = targetGridY;
	}

	public int getUnitGridX() {
		return unitGridX;
	}

	public int getUnitGridY() {
		return unitGridY;
	}

	public int getTargetGridX() {
		return targetGridX;
	}

	public int getTargetGridY() {
		return targetGridY;
	}

	public int getUnitID() {
		return unitID;
	}

	public int getTargetID() {
		return targetID;
	}
}
