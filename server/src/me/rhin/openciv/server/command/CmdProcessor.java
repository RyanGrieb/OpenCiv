package me.rhin.openciv.server.command;

import java.util.Arrays;
import java.util.HashMap;

import me.rhin.openciv.server.command.type.StartGameCommand;
import me.rhin.openciv.server.command.type.StopGameCommand;

public class CmdProcessor {
	private HashMap<String, Command> commands;
	public boolean enabled;

	public CmdProcessor() {
		this.commands = new HashMap<>();
		this.enabled = true;
		registerCommands();
	}

	private void registerCommands() {
		commands.put("start", new StartGameCommand());
		commands.put("stop", new StopGameCommand());
	}

	public void proccessCommand(String input) {
		Command cmd = parseCommand(input);

		if (cmd == null) {
			System.out.println("[Server] Error: Command not found");
			return;
		}

		String[] args = input.split(" ");
		args = Arrays.copyOfRange(args, 1, args.length);
		cmd.call(args);
	}

	private Command parseCommand(String input) {
		String cmdName = input.split(" ")[0];
		Command cmd = commands.get(cmdName);
		return cmd;
	}

	public void disable() {
		this.enabled = false;
	}

	public void enable() {
		this.enabled = true;
	}
}
