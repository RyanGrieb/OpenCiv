package me.rhin.openciv.server.game.religion.bonus.type.founder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.stat.Stat;

public class WorldChurchBonus extends ReligionBonus implements Listener {

	private static final Logger LOGGER = LoggerFactory.getLogger(WorldChurchBonus.class);

	public WorldChurchBonus() {
		Server.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onLooseFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
		if (player == null)
			return;

		if (!religion.getPlayer().equals(player))
			return;

		// Only foreign cities.
		if (city.getPlayerOwner().equals(player))
			return;

		if (oldFollowerCount >= 5 && newFollowerCount < 5) {
			player.getReligion().getStatLine().subValue(Stat.HERITAGE_GAIN, 1);
			player.updateOwnedStatlines(false);
		}
	}

	@EventHandler
	public void onGainFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
		if (player == null)
			return;

		if (!religion.getPlayer().equals(player))
			return;

		// Only foreign cities.
		if (city.getPlayerOwner().equals(player))
			return;

		LOGGER.info(city.getName() + " - " + oldFollowerCount + "," + newFollowerCount);

		if (oldFollowerCount <= 4 && newFollowerCount > 4) {
			player.getReligion().getStatLine().addValue(Stat.HERITAGE_GAIN, 1);
			player.updateOwnedStatlines(false);
		}
	}

}
