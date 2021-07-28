package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetCityHealthPacket extends Packet {

	private String cityName;
	private float health;
	private float maxHealth;
	private int combatStrength;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("health", health);
		json.writeValue("maxHealth", maxHealth);
		json.writeValue("combatStrength", combatStrength);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.health = jsonData.getFloat("health");
		this.maxHealth = jsonData.getFloat("maxHealth");
		this.combatStrength = jsonData.getInt("combatStrength");
	}

	public void setCity(String cityName, float health) {
		this.cityName = cityName;
		this.health = health;
		this.maxHealth = -1;
		this.combatStrength = -1;
	}

	public void setCity(String cityName, float health, float maxHealth, int combatStrength) {
		this.cityName = cityName;
		this.health = health;
		this.maxHealth = maxHealth;
		this.combatStrength = combatStrength;
	}

	public String getCityName() {
		return cityName;
	}

	public float getHealth() {
		return health;
	}

	public float getMaxHealth() {
		return maxHealth;
	}

	public int getCombatStrength() {
		return combatStrength;
	}
}
