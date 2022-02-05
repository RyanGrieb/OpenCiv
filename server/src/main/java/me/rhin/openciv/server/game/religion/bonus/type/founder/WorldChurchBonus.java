package me.rhin.openciv.server.game.religion.bonus.type.founder;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.server.listener.GainFollowerListener;
import me.rhin.openciv.server.listener.LooseFollowerListener;
import me.rhin.openciv.shared.stat.Stat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WorldChurchBonus extends ReligionBonus implements GainFollowerListener, LooseFollowerListener {

	private static final Logger LOGGER = LoggerFactory.getLogger(WorldChurchBonus.class);

	public WorldChurchBonus() {
		Server.getInstance().getEventManager().addListener(GainFollowerListener.class, this);
		Server.getInstance().getEventManager().addListener(LooseFollowerListener.class, this);
	}

	@Override
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

	@Override
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
