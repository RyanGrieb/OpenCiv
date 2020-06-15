package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class MoveUnitPacket extends Packet {

	private int movementCost;
	private int prevGridX, prevGridY;
	private int targetGridX, targetGridY;
	private String unitName;
	private String playerOwner;

	public MoveUnitPacket() {
		super(MoveUnitPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("movementCost", movementCost);
		json.writeValue("prevGridX", prevGridX);
		json.writeValue("prevGridY", prevGridY);
		json.writeValue("targetGridX", targetGridX);
		json.writeValue("targetGridY", targetGridY);
		json.writeValue("unitName", unitName);
		json.writeValue("playerOwner", playerOwner);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.movementCost = jsonData.getInt("movementCost");
		this.prevGridX = jsonData.getInt("prevGridX");
		this.prevGridY = jsonData.getInt("prevGridY");
		this.targetGridX = jsonData.getInt("targetGridX");
		this.targetGridY = jsonData.getInt("targetGridY");
		this.unitName = jsonData.getString("unitName");
		this.playerOwner = jsonData.getString("playerOwner");
	}

	public void setUnit(String playerOwner, String unitName, int prevGridX, int prevGridY, int targetGridX,
			int targetGridY) {
		this.prevGridX = prevGridX;
		this.prevGridY = prevGridY;
		this.targetGridX = targetGridX;
		this.targetGridY = targetGridY;
		this.unitName = unitName;
		this.playerOwner = playerOwner;
	}

	public void setMovementCost(int movementCost) {
		this.movementCost = movementCost;
	}

	public int getMovementCost() {
		return movementCost;
	}

	public int getTargetGridX() {
		return targetGridX;
	}

	public int getTargetGridY() {
		return targetGridY;
	}

	public int getPrevGridX() {
		return prevGridX;
	}

	public int getPrevGridY() {
		return prevGridY;
	}

	public String getUnitName() {
		return unitName;
	}

	public String getPlayerOwner() {
		return playerOwner;
	}
}
