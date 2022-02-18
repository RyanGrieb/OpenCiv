package me.rhin.openciv.server.command.type;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.command.Command;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.FallbackNode;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.ui.BehaviorTreeWindow;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;

public class BehaviorTreeCommand extends Command {

	public BehaviorTreeCommand() {
		super("tree");
	}

	@Override
	public void call(WebSocket conn, SendChatMessagePacket packet, String[] args) {
		if (args.length < 1) {
			sendServerMessage(conn, packet, "Error: Enter a unit ID or player name");
			return;
		}

		String arg = args[0];

		// If the string is a number
		if (arg.matches("-?\\d+")) {
			int unitID = Integer.parseInt(arg);
			Unit unit = Server.getInstance().getInGameState().getUnitByID(unitID);

			if (unit == null) {
				sendServerMessage(conn, packet, "Error: Unit from id not found");
				return;
			}

			if (unit.getAIBehavior() == null) {
				sendServerMessage(conn, packet, "Error: Unit doesn't have AI behavior");
				return;
			}

			new BehaviorTreeWindow(unit.getName() + ":" + unit.getID(), unit.getAIBehavior().getMainNode());
		} else {
			AbstractPlayer player = Server.getInstance().getPlayerByName(arg);
		}
	}

	public void createBehaviorTreeWindow(FallbackNode fallbackNode) {

	}
}
