package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class AddSpecialistToContainerPacket extends Packet {

	private String cityName;
	private String containerName;
	private int amount;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("containerName", containerName);
		json.writeValue("amount", amount);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.containerName = jsonData.getString("containerName");
		this.amount = jsonData.getInt("amount");
	}

	public void setContainer(String cityName, String containerName, int amount) {
		this.cityName = cityName;
		this.containerName = cityName;
		this.amount = amount;
	}

	public String getCityName() {
		return cityName;
	}

	public String getContainerName() {
		return containerName;
	}

	public int getAmount() {
		return amount;
	}
}
