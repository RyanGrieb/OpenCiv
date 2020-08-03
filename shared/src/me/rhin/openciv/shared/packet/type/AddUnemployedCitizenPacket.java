package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class AddUnemployedCitizenPacket extends Packet {
		
	private int amount;
	
	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("amount", amount);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.amount = jsonData.getInt("amount");
	}

	public void setAmount(int amount) {
		this.amount = amount;
	}

	public int getAmount() {
		return amount;
	}
	
}
