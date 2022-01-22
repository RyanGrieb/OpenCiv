package me.rhin.openciv.server.command.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public class StopGameCommand extends Command {

	public StopGameCommand() {
		super("stop");
	}

	@Override
	public void call(WebSocket conn, SendChatMessagePacket packet, String[] args) {
	}
}
