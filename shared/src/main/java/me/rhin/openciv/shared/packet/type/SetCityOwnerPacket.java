package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetCityOwnerPacket extends Packet {

	private String cityName;
	private String playerName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("playerName", playerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.playerName = jsonData.getString("playerName");
	}

	public void setCity(String cityName, String playerName) {
		this.cityName = cityName;
		this.playerName = playerName;
	}

	public String getCityName() {
		return cityName;
	}

	public String getPlayerName() {
		return playerName;
	}

}
