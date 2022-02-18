package me.rhin.openciv.server.command;

import java.util.Arrays;
import java.util.HashMap;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.type.BehaviorTreeCommand;
import me.rhin.openciv.server.command.type.ScenarioCommand;
import me.rhin.openciv.server.command.type.StartGameCommand;
import me.rhin.openciv.server.command.type.StopGameCommand;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public class CmdProcessor {

	private static final Logger LOGGER = LoggerFactory.getLogger(CmdProcessor.class);

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
		commands.put("scenario", new ScenarioCommand());
		commands.put("tree", new BehaviorTreeCommand());
	}

	public void proccessCommand(String input) {
		proccessCommand(null, null, input);
	}

	public void proccessCommand(WebSocket conn, SendChatMessagePacket packet, String input) {
		Command cmd = parseCommand(input);

		if (cmd == null) {

			if (conn != null) {
				Player player = Server.getInstance().getPlayerByConn(conn);
				packet.setMessage("Error: Invalid command");
				packet.setServerMessage(true);

				Json json = new Json();
				player.sendPacket(json.toJson(packet));
			} else
				LOGGER.info("[Server] Error: Command not found");

			return;
		}

		String[] args = input.split(" ");
		args = Arrays.copyOfRange(args, 1, args.length);

		cmd.call(conn, packet, args);
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
