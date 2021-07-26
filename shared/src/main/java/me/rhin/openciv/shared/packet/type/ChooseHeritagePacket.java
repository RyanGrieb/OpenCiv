package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ChooseHeritagePacket extends Packet {

	private String heritageName;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("heritageName", heritageName);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.heritageName = jsonData.getString("heritageName");
	}

	public void setName(String heritageName) {
		this.heritageName = heritageName;
	}

	public String getName() {
		return heritageName;
	}

}
