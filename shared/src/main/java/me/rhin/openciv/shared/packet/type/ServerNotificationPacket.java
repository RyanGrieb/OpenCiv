package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class ServerNotificationPacket extends Packet {

	private String iconName;
	private String text;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("iconName", iconName);
		json.writeValue("text", text);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.iconName = jsonData.getString("iconName");
		this.text = jsonData.getString("text");
	}

	public void setNotification(String iconName, String text) {
		this.iconName = iconName;
		this.text = text;
	}

	public String getIconName() {
		return iconName;
	}

	public String getText() {
		return text;
	}
}
