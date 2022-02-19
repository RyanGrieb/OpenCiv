package me.rhin.openciv.server.game.ai.behavior.nodes;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.PlayerNode;
import me.rhin.openciv.shared.packet.type.DeclareWarAllPacket;

public class DeclareTotalWarNode extends PlayerNode {

	public DeclareTotalWarNode(AbstractPlayer player, String name) {
		super(player, name);
	}

	@Override
	public BehaviorResult tick() {
		player.getDiplomacy().declarWarAll();

		DeclareWarAllPacket packet = new DeclareWarAllPacket();
		packet.setCombatant(getName());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers()) {
			player.sendPacket(json.toJson(packet));
		}

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
