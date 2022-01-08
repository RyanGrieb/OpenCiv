package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class FoundReligionPacket extends Packet {

	private String playerName;
	private int unitID;
	private int gridX, gridY;
	private int iconID;
	private int founderID;
	private int followerID;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("playerName", playerName);
		json.writeValue("unitID", unitID);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
		json.writeValue("iconID", iconID);
		json.writeValue("founderID", founderID);
		json.writeValue("followerID", followerID);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.playerName = jsonData.getString("playerName");
		this.unitID = jsonData.getInt("unitID");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
		this.iconID = jsonData.getInt("iconID");
		this.founderID = jsonData.getInt("founderID");
		this.followerID = jsonData.getInt("followerID");
	}

	public void setReligion(int unitID, int gridX, int gridY, int iconID, int founderID, int followerID) {
		this.unitID = unitID;
		this.gridX = gridX;
		this.gridY = gridY;
		this.iconID = iconID;
		this.followerID = founderID;
		this.followerID = followerID;
	}
	
	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public String getPlayerName() {
		return playerName;
	}
	
	public int getUnitID() {
		return unitID;
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public int getIconID() {
		return iconID;
	}

	public int getFounderID() {
		return founderID;
	}

	public int getFollowerID() {
		return followerID;
	}
}
