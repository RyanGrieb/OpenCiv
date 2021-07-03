package me.rhin.openciv.server.command.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;
import me.rhin.openciv.server.listener.StartGameRequestListener.StartGameRequestEvent;

public class StartGameCommand extends Command {

	public StartGameCommand() {
		super("start");
	}

	@Override
	public void call(String[] args) {
		Server.getInstance().getEventManager().fireEvent(new StartGameRequestEvent());
	}
}
