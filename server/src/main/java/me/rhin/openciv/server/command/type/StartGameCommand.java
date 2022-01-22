package me.rhin.openciv.server.command.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;
import me.rhin.openciv.server.listener.StartGameRequestListener.StartGameRequestEvent;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public class StartGameCommand extends Command {

	public StartGameCommand() {
		super("start");
	}

	@Override
	public void call(WebSocket conn, SendChatMessagePacket packet, String[] args) {
		Server.getInstance().getEventManager().fireEvent(new StartGameRequestEvent());
	}
}
