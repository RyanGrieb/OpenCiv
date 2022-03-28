package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ChangeNamePacket extends Packet {

	private String prevPlayerName;
	private String name;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("prevPlayerName", prevPlayerName);
		json.writeValue("name", name);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.prevPlayerName = jsonData.getString("prevPlayerName");
		this.name = jsonData.getString("name");
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setPrevName(String prevPlayerName) {
		this.prevPlayerName = prevPlayerName;
	}

	public String getName() {
		return name;
	}

	public String getPrevPlayerName() {
		return prevPlayerName;
	}

}
