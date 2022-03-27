package me.rhin.openciv.server.events.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.shared.listener.Event;

public class DisconnectEvent implements Event {

	private WebSocket conn;

	public DisconnectEvent(WebSocket conn) {
		this.conn = conn;
	}

	@Override
	public String getMethodName() {
		return "onDisconnect";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { conn };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { WebSocket.class };
	}

}
