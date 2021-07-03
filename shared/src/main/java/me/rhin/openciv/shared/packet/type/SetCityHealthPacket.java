package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetCityHealthPacket extends Packet {

	private String cityName;
	private float health;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("health", health);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.health = jsonData.getFloat("health");
	}

	public void setCity(String cityName, float health) {
		this.cityName = cityName;
		this.health = health;
	}

	public String getCityName() {
		return cityName;
	}

	public float getHealth() {
		return health;
	}

}
