package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SettleCityPacket extends Packet {

	private int gridX, gridY;
	private String playerOwner;

	public SettleCityPacket() {
		super(SettleCityPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerOwner", playerOwner);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerOwner = jsonData.getString("playerOwner");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public void setLocation(int gridX, int gridY) {
		this.gridX = gridX;
		this.gridY = gridY;
	}

	public void setOwner(String playerOwner) {
		this.playerOwner = playerOwner;
	}

	public String getPlayerOwner() {
		return playerOwner;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}
}
