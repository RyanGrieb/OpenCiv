package me.rhin.openciv.server.command.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;

public class StopGameCommand extends Command {

	public StopGameCommand() {
		super("stop");
	}

	@Override
	public void call(String[] args) {
		Server.getInstance().getGame().stop();
	}
}
