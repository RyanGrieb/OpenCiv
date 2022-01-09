package me.rhin.openciv.server.game.religion.bonus.type.founder;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.server.listener.GainFollowerListener;
import me.rhin.openciv.server.listener.LooseFollowerListener;
import me.rhin.openciv.shared.stat.Stat;

public class TitheBonus extends ReligionBonus implements GainFollowerListener, LooseFollowerListener {
	
	public TitheBonus() {
		Server.getInstance().getEventManager().addListener(GainFollowerListener.class, this);
		Server.getInstance().getEventManager().addListener(LooseFollowerListener.class, this);
	}
	
	@Override
	public void onAssigned() {

		for (AbstractPlayer player : Server.getInstance().getAbstractPlayers()) {
			for (City city : player.getOwnedCities()) {

				if (city.getCityReligion().getFollowersOfReligion(player.getReligion()) > 3) {
					player.getReligion().getStatLine().addValue(Stat.GOLD_GAIN, 1);
				}
			}
		}

		player.updateOwnedStatlines(false);
	}

	@Override
	public void onLooseFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
		if (player == null)
			return;

		if (!religion.getPlayer().equals(player))
			return;

		if (oldFollowerCount == 4 && newFollowerCount < 4)
			player.getReligion().getStatLine().subValue(Stat.GOLD_GAIN, 1);
	}

	@Override
	public void onGainFollower(PlayerReligion religion, City city, int oldFollowerCount, int newFollowerCount) {
		if (player == null)
			return;

		if (!religion.getPlayer().equals(player))
			return;

		if (oldFollowerCount == 3 && newFollowerCount > 3)
			player.getReligion().getStatLine().addValue(Stat.GOLD_GAIN, 1);
	}

}
