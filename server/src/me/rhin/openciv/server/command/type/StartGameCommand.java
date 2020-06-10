package me.rhin.openciv.server.command.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;

public class StartGameCommand extends Command {

	public StartGameCommand() {
		super("start");
	}

	@Override
	public void call(String[] args) {
		Server.getInstance().getGame().start();
	}
}
