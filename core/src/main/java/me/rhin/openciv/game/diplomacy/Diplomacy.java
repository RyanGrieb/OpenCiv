package me.rhin.openciv.game.diplomacy;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.listener.DeclareWarAllListener;
import me.rhin.openciv.listener.DeclareWarListener;
import me.rhin.openciv.shared.packet.type.DeclareWarAllPacket;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;

public class Diplomacy implements DeclareWarListener, DeclareWarAllListener {

	private AbstractPlayer player;
	private ArrayList<AbstractPlayer> enemies;

	public Diplomacy(AbstractPlayer player) {
		this.player = player;

		this.enemies = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(DeclareWarListener.class, this);
		Civilization.getInstance().getEventManager().addListener(DeclareWarAllListener.class, this);
	}

	@Override
	public void onDeclareWar(DeclareWarPacket packet) {
		if (!player.getName().equals(packet.getAttacker()))
			return;

		AbstractPlayer defender = Civilization.getInstance().getGame().getPlayers().get(packet.getDefender());

		declareWar(defender);
	}

	@Override
	public void onDeclareWarAll(DeclareWarAllPacket packet) {
		if (!player.getName().equals(packet.getAttacker()))
			return;

		for (AbstractPlayer player : Civilization.getInstance().getGame().getPlayers().values()) {
			if (player.getName().equals(packet.getAttacker()))
				continue;

			declareWar(player);
		}
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
