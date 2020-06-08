package me.rhin.openciv.shared.packet;

import java.util.HashMap;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

public abstract class Packet implements Json.Serializable {

	protected String packetName;
	// protected HashMap<String, String> values;

	public Packet(String packetName) {
		this.packetName = packetName;
		// this.values = new HashMap<>();
	}

	// TODO: Figure out if I ever want to use this.
	/*
	 * @Override public void write(Json json) { json.writeValue("packetName",
	 * packetName); for (String key : values.keySet()) { json.writeValue(key,
	 * values.get(key)); } }
	 * 
	 * @Override public void read(Json json, JsonValue jsonMap) { for (JsonValue
	 * entry = jsonMap.child; entry != null; entry = entry.next) {
	 * System.out.println(entry.name + " = " + entry.asString()); if
	 * (entry.name.equals("packetName")) packetName = entry.asString(); else
	 * values.put(entry.name, entry.asString()); } }
	 * 
	 * public void setValue(String key, String value) { values.put(key, value); }
	 */

	public String getPacketName() {
		return packetName;
	}
}
