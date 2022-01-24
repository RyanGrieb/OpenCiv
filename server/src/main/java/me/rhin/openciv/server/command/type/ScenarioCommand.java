package me.rhin.openciv.server.command.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;
import me.rhin.openciv.server.game.state.InGameState;
import me.rhin.openciv.server.scenarios.Scenario;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public class ScenarioCommand extends Command {

	public ScenarioCommand() {
		super("scenario");
	}

	@Override
	public void call(WebSocket conn, SendChatMessagePacket packet, String[] args) {
		if (args.length < 1) {
			sendServerMessage(conn, packet, "Error: Enter a scenario name - ");
			return;
		}

		Scenario scenario = Server.getInstance().getGame().getScenarioList().byName(args[0]);

		if (scenario == null) {
			sendServerMessage(conn, packet, "Error: Scenario not found");
			return;
		}

		if (scenario.preGameOnly() && Server.getInstance().getGame() instanceof InGameState) {
			sendServerMessage(conn, packet, "Error: Scenario can only be toggled before the game");
			return;
		}

		if (Server.getInstance().getGame().getEnabledScenarios().contains(scenario)) {
			// FIXME: If scenario is already added, remove it.
			sendServerMessage(conn, packet, "Error: Scenario already enabled");
			return;
		}

		Server.getInstance().getGame().addScenario(scenario);
		sendServerMessage(conn, packet, "Added scenario: " + args[0]);

	}

}
