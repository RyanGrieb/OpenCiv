package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class PickPantheonPacket extends Packet {

	private int bonusID;
	private String playerName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("bonusID", bonusID);
		json.writeValue("playerName", playerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.bonusID = jsonData.getInt("bonusID");
		this.playerName = jsonData.getString("playerName");
	}

	public int getReligionBonusID() {
		return bonusID;
	}

	public void setBonusID(int bonusID) {
		this.bonusID = bonusID;
	}

	public String getPlayerName() {
		return playerName;
	}
	
	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

}
