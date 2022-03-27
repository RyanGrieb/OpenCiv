package me.rhin.openciv.server.events.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.shared.listener.Event;

public class ConnectionEvent implements Event {

	private WebSocket conn;

	public ConnectionEvent(WebSocket conn) {
		this.conn = conn;
	}

	@Override
	public String getMethodName() {
		return "onConnection";
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
