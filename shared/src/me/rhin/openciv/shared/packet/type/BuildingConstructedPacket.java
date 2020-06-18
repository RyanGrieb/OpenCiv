package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class BuildingConstructedPacket extends Packet {

	private String cityName;
	private String buildingName;

	public BuildingConstructedPacket() {
		super(BuildingConstructedPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("buildingName", buildingName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.buildingName = jsonData.getString("buildingName");
	}

	public void setCityName(String cityName) {
		this.cityName = cityName;
	}

	public void setBuildingName(String buildingName) {
		this.buildingName = buildingName;
	}

	public String getCityName() {
		return cityName;
	}

	public String getBuildingName() {
		return buildingName;
	}

}
