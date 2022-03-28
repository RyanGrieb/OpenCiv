package me.rhin.openciv.game.diplomacy;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.shared.packet.type.DeclareWarAllPacket;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;
import me.rhin.openciv.shared.packet.type.DiscoveredPlayerPacket;

public class Diplomacy implements Listener {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private AbstractPlayer player;
	private ArrayList<AbstractPlayer> discoveredPlayers;
	private ArrayList<AbstractPlayer> enemies;

	public Diplomacy(AbstractPlayer player) {
		this.player = player;

		this.discoveredPlayers = new ArrayList<>();
		this.enemies = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onDeclareWar(DeclareWarPacket packet) {
		if (!player.getName().equals(packet.getAttacker()))
			return;

		AbstractPlayer defender = Civilization.getInstance().getGame().getPlayers().get(packet.getDefender());

		declareWar(defender);
	}

	@EventHandler
	public void onDeclareWarAll(DeclareWarAllPacket packet) {
		if (!player.getName().equals(packet.getAttacker()))
			return;

		for (AbstractPlayer player : Civilization.getInstance().getGame().getPlayers().values()) {
			if (player.getName().equals(packet.getAttacker())) {
				continue;
			}

			declareWar(player);
		}
	}

	@EventHandler
	public void onDiscoverPlayer(DiscoveredPlayerPacket packet) {
		if (!player.getName().equals(packet.getPlayerName())) {
			return;
		}

		LOGGER.info(player.getName() + " Discovered - " + packet.getDiscoveredPlayerName());

		AbstractPlayer discoveredPlayer = Civilization.getInstance().getGame().getPlayers()
				.get(packet.getDiscoveredPlayerName());
		discoveredPlayers.add(discoveredPlayer);
	}

	public void declareWar(AbstractPlayer targetPlayer) {
		LOGGER.info(player.getName() + " declared war on " + targetPlayer.getName());

		addEnemy(targetPlayer);
		targetPlayer.getDiplomacy().addEnemy(player);
	}

	public void addEnemy(AbstractPlayer otherPlayer) {
		enemies.add(otherPlayer);
	}

	public boolean atWar(AbstractPlayer otherPlayer) {
		return enemies.contains(otherPlayer);
	}

	public ArrayList<AbstractPlayer> getDiscoveredPlayers() {
		return discoveredPlayers;
	}
}
