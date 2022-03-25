package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class RemoveQueuedProductionItemPacket extends Packet {

	private String cityName;
	private String itemName;
	private int index;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("itemName", itemName);
		json.writeValue("index", index);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.itemName = jsonData.getString("itemName");
		this.index = jsonData.getInt("index");
	}

	public void setProductionItem(String cityName, String itemName, int index) {
		this.cityName = cityName;
		this.itemName = itemName;
		this.index = index;
	}

	public String getCityName() {
		return cityName;
	}

	public String getItemName() {
		return itemName;
	}

	public int getIndex() {
		return index;
	}
}
