package me.rhin.openciv.server.command;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public abstract class Command {
	private String name;

	public Command(String name) {
		this.name = name;
	}

	public abstract void call(WebSocket conn, SendChatMessagePacket packet, String[] args);

	protected void sendServerMessage(WebSocket conn, SendChatMessagePacket packet, String message) {
		if (conn == null) {
			System.out.println(message);
			return;
		}

		packet.setMessage(message);
		packet.setServerMessage(true);

		Json json = new Json();

		Server.getInstance().getPlayerByConn(conn).sendPacket(json.toJson(packet));
	}

	public String getName() {
		return name;
	}
}
