package me.rhin.openciv.server.game.policy;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.stat.Stat;

public class PolicyManager implements NextTurnListener {

	private Player player;
	private int tempStudiedPolicies;

	public PolicyManager(Player player) {
		this.player = player;

		player.getStatLine().setValue(Stat.POLICY_COST, getPolicyCost());

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}	

	@Override
	public void onNextTurn() {
		if (player.getStatLine().getStatValue(Stat.HERITAGE) >= player.getStatLine().getStatValue(Stat.POLICY_COST)) {

		}
	}

	private int getPolicyCost() {

		return (int) (25 + Math.pow(6 * tempStudiedPolicies, 1.7));
	}

}
