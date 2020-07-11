package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ApplyProductionToItemPacket extends Packet {

	private String cityName;
	private String itemName;
	private float productionAmount;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("itemName", itemName);
		json.writeValue("productionAmount", productionAmount);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.itemName = jsonData.getString("itemName");
		this.productionAmount = jsonData.getFloat("productionAmount");
	}

	public void setProductionItem(String cityName, String itemName, float productionAmount) {
		this.cityName = cityName;
		this.itemName = itemName;
		this.productionAmount = productionAmount;
	}

	public String getCityName() {
		return cityName;
	}

	public String getItemName() {
		return itemName;
	}

	public float getProductionAmount() {
		return productionAmount;
	}
}
