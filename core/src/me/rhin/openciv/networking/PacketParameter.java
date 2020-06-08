package me.rhin.openciv.networking;

import com.badlogic.gdx.utils.Json;
import com.github.czyzby.websocket.WebSocket;

public class PacketParameter {

	public WebSocket conn;
	public String packet;

	public PacketParameter(WebSocket conn, String packet) {
		this.conn = conn;
		this.packet = packet;
	}

	public WebSocket getConn() {
		return conn;
	}

	public String getPacket() {
		return packet;
	}
}
