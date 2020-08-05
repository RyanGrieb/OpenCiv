package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class RemoveSpecialistFromContainerPacket extends Packet {

	private String cityName;
	private String containerName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("containerName", containerName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.containerName = jsonData.getString("containerName");
	}

	public void setContainer(String cityName, String containerName) {
		this.cityName = cityName;
		this.containerName = cityName;
	}

	public String getCityName() {
		return cityName;
	}

	public String getContainerName() {
		return containerName;
	}

}
