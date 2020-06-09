package me.rhin.openciv.server;

import org.java_websocket.WebSocket;

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
