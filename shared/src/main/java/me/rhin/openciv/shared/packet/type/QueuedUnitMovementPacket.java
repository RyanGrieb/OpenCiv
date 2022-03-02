package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class QueuedUnitMovementPacket extends Packet {

	private float movementCost;
	private int prevGridX, prevGridY;
	private int targetGridX, targetGridY;
	private int unitID;
	private String playerOwner;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("movementCost", movementCost);
		json.writeValue("prevGridX", prevGridX);
		json.writeValue("prevGridY", prevGridY);
		json.writeValue("targetGridX", targetGridX);
		json.writeValue("targetGridY", targetGridY);
		json.writeValue("unitID", unitID);
		json.writeValue("playerOwner", playerOwner);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.movementCost = jsonData.getFloat("movementCost");
		this.prevGridX = jsonData.getInt("prevGridX");
		this.prevGridY = jsonData.getInt("prevGridY");
		this.targetGridX = jsonData.getInt("targetGridX");
		this.targetGridY = jsonData.getInt("targetGridY");
		this.unitID = jsonData.getInt("unitID");
		this.playerOwner = jsonData.getString("playerOwner");
	}

	public void setUnit(String playerOwner, int unitID, int prevGridX, int prevGridY, int targetGridX,
			int targetGridY) {
		this.prevGridX = prevGridX;
		this.prevGridY = prevGridY;
		this.targetGridX = targetGridX;
		this.targetGridY = targetGridY;
		this.unitID = unitID;
		this.playerOwner = playerOwner;
	}

	public float getMovementCost() {
		return movementCost;
	}

	public int getPrevGridX() {
		return prevGridX;
	}

	public int getPrevGridY() {
		return prevGridY;
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

	public String getPlayerOwner() {
		return playerOwner;
	}
}
