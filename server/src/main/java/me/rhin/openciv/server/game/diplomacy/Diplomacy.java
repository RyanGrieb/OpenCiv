package me.rhin.openciv.server.game.diplomacy;

import java.util.ArrayList;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;

public class Diplomacy {

	private AbstractPlayer player;

	private ArrayList<AbstractPlayer> enemies;
	private ArrayList<AbstractPlayer> allies;

	public Diplomacy(AbstractPlayer player) {
		this.player = player;

		this.enemies = new ArrayList<>();
		this.allies = new ArrayList<>();
	}

	@Override
	public String toString() {
		String output = "";
		for (AbstractPlayer player : enemies) {
			output += "WAR: " + player.getName() + "\n";
		}

		return output;
	}

	public void declareWar(AbstractPlayer targetPlayer) {
		System.out.println(player.getName() + " declared war on " + targetPlayer.getName());
		
		addEnemy(targetPlayer);
		targetPlayer.getDiplomacy().addEnemy(player);
	}

	public void declarWarAll() {
		for (AbstractPlayer otherPlayer : Server.getInstance().getAbstractPlayers()) {
			if (player.equals(otherPlayer))
				continue;

			declareWar(otherPlayer);
		}
	}

	public void addEnemy(AbstractPlayer otherPlayer) {
		enemies.add(otherPlayer);
	}

	public boolean atWar(AbstractPlayer otherPlayer) {
		return enemies.contains(otherPlayer);
	}

}
