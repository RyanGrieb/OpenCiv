package me.rhin.openciv.game.diplomacy;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.listener.DeclareWarListener;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;

public class Diplomacy implements DeclareWarListener {

	private AbstractPlayer player;
	private ArrayList<AbstractPlayer> enemies;

	public Diplomacy(AbstractPlayer player) {
		this.player = player;

		this.enemies = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(DeclareWarListener.class, this);
	}

	@Override
	public void onDeclareWar(DeclareWarPacket packet) {
		if (!player.getName().equals(packet.getAttacker()))
			return;

		AbstractPlayer defender = Civilization.getInstance().getGame().getPlayers().get(packet.getDefender());

		declareWar(defender);
	}

	public void declareWar(AbstractPlayer targetPlayer) {
		System.out.println(player.getName() + " declared war on " + targetPlayer.getName());

		addEnemy(targetPlayer);
		targetPlayer.getDiplomacy().addEnemy(player);
	}

	public void addEnemy(AbstractPlayer otherPlayer) {
		enemies.add(otherPlayer);
	}

	public boolean atWar(AbstractPlayer otherPlayer) {
		return enemies.contains(otherPlayer);
	}
}
