package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class RemoveObservedTilePacket extends Packet {

	private String playerOwner;
	private int unitID;
	private int tileGridX;
	private int tileGridY;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("tileGridX", tileGridX);
		json.writeValue("tileGridY", tileGridY);
		json.writeValue("unitID", unitID);
		json.writeValue("playerOwner", playerOwner);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tileGridX = jsonData.getInt("tileGridX");
		this.tileGridY = jsonData.getInt("tileGridY");
		this.unitID = jsonData.getInt("unitID");
		this.playerOwner = jsonData.getString("playerOwner");
	}

	public void setTileObserver(String playerOwner, int unitID, int tileGridX, int tileGridY) {
		this.playerOwner = playerOwner;
		this.unitID = unitID;
		this.tileGridX = tileGridX;
		this.tileGridY = tileGridY;
	}

	public String getPlayerOwner() {
		return playerOwner;
	}

	public int getUnitID() {
		return unitID;
	}

	public int getTileGridX() {
		return tileGridX;
	}

	public int getTileGridY() {
		return tileGridY;
	}

}
