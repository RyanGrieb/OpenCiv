package me.rhin.openciv.server.game.religion.bonus.type.follower;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.stat.Stat;

public class SwordsIntoPlowsharesBonus extends ReligionBonus implements Listener {

	public SwordsIntoPlowsharesBonus() {
		Server.getInstance().getEventManager().addListener(this);
	}

	@Override
	public void onAssigned() {
		if (player.getDiplomacy().inWar())
			return;

		for (City city : player.getOwnedCities()) {
			if (city.getCityReligion().getMajorityReligion() != null
					&& city.getCityReligion().getMajorityReligion().equals(player.getReligion()))
				city.getStatLine().addModifier(Stat.FOOD_GAIN, 0.15F);
		}
	}

	@EventHandler
	public void onCityGainMajorityReligion(City city, PlayerReligion newReligion) {
		if (player == null)
			return;

		if (newReligion.equals(player.getReligion()) && !city.getPlayerOwner().getDiplomacy().inWar()) {
			city.getStatLine().addModifier(Stat.FOOD_GAIN, 0.15F);
		}
	}

	@EventHandler
	public void onCityLooseMajorityReligion(City city, PlayerReligion oldReligion) {
		if (player == null)
			return;

		if (oldReligion == null)
			return;

		if (oldReligion.equals(player.getReligion()) && !city.getPlayerOwner().getDiplomacy().inWar()) {
			city.getStatLine().subModifier(Stat.FOOD_GAIN, 0.15F);
		}
	}

	@EventHandler
	public void onDeclareWar(AbstractPlayer attacker, AbstractPlayer defender) {
		if (player == null)
			return;

		for (City city : attacker.getOwnedCities()) {
			if (city.getCityReligion().getMajorityReligion().equals(player.getReligion())) {
				city.getStatLine().subModifier(Stat.FOOD_GAIN, 0.15F);
			}
		}

		for (City city : defender.getOwnedCities()) {
			if (city.getCityReligion().getMajorityReligion().equals(player.getReligion())) {
				city.getStatLine().subModifier(Stat.FOOD_GAIN, 0.15F);
			}
		}
	}

}
