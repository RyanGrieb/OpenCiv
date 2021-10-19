package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class UnitAttackPacket extends Packet {

	//TODO: Utilize unit ID's clientside.
	
	private int unitGridX, unitGridY, targetGridX, targetGridY;
	private int unitID, targetID;
	private float unitDamage, targetUnitDamage;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("unitGridX", unitGridX);
		json.writeValue("unitGridY", unitGridY);

		json.writeValue("targetGridX", targetGridX);
		json.writeValue("targetGridY", targetGridY);

		json.writeValue("unitID", unitID);
		json.writeValue("targetID", targetID);

		json.writeValue("unitDamage", unitDamage);
		json.writeValue("targetUnitDamage", targetUnitDamage);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);

		this.unitGridX = jsonData.getInt("unitGridX");
		this.unitGridY = jsonData.getInt("unitGridY");

		this.targetGridX = jsonData.getInt("targetGridX");
		this.targetGridY = jsonData.getInt("targetGridY");

		this.unitID = jsonData.getInt("unitID");
		this.targetID = jsonData.getInt("targetID");

		this.unitDamage = jsonData.getFloat("unitDamage");
		this.targetUnitDamage = jsonData.getFloat("targetUnitDamage");
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

	public void setUnitDamage(float unitDamage) {
		this.unitDamage = unitDamage;
	}

	public void setTargetDamage(float targetUnitDamage) {
		this.targetUnitDamage = targetUnitDamage;
	}

	public float getUnitDamage() {
		return unitDamage;
	}

	public float getTargetUnitDamage() {
		return targetUnitDamage;
	}

	public void setUnitLocations(int unitGridX, int unitGridY, int targetGridX, int targetGridY) {
		this.unitGridX = unitGridX;
		this.unitGridY = unitGridY;
		this.targetGridX = targetGridX;
		this.targetGridY = targetGridY;
	}

	public void setIDs(int unitID, int targetID) {
		this.unitID = unitID;
		this.targetID = targetID;
	}

}
