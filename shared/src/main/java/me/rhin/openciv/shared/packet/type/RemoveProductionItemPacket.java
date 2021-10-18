package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

//FIXME: I thought this was different from finishProductionItemPacket.
//I want to merge some packets in the future.
public class RemoveProductionItemPacket extends Packet {

	private String cityName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
	}

	public void setCityName(String cityName) {
		this.cityName = cityName;
	}

	public String getCityName() {
		return cityName;
	}
}
