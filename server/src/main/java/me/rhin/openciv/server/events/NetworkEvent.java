package me.rhin.openciv.server.events;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.packet.Packet;

public class NetworkEvent implements Event {

	private String methodName;
	private WebSocket conn;
	private Packet packet;

	public NetworkEvent(String methodName, WebSocket conn, Class<? extends Packet> packetClass, String packetData) {
		this.methodName = methodName;
		this.conn = conn;

		Json json = new Json();
		this.packet = json.fromJson(packetClass, packetData);
	}

	@Override
	public String getMethodName() {
		return methodName;
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { conn, packet };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { WebSocket.class, packet.getClass() };
	}
}
