package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class BuyProductionItemPacket extends Packet {
	private String cityName;
	private String itemName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("itemName", itemName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.itemName = jsonData.getString("itemName");
	}

	public void setProductionItem(String cityName, String itemName) {
		this.cityName = cityName;
		this.itemName = itemName;
	}

	public String getCityName() {
		return cityName;
	}

	public String getItemName() {
		return itemName;
	}
}
