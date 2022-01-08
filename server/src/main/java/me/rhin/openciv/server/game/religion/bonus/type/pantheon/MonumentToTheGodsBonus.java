package me.rhin.openciv.server.game.religion.bonus.type.pantheon;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.server.listener.CityGainMajorityReligionListener;
import me.rhin.openciv.server.listener.CityLooseMajorityReligionListener;

public class MonumentToTheGodsBonus extends ReligionBonus
		implements CityGainMajorityReligionListener, CityLooseMajorityReligionListener {

	public MonumentToTheGodsBonus() {
		//FIXME: Init these when were assigned a player.
		Server.getInstance().getEventManager().addListener(CityGainMajorityReligionListener.class, this);
		Server.getInstance().getEventManager().addListener(CityLooseMajorityReligionListener.class, this);
	}

	@Override
	public void onCityGainMajorityReligion(City city, PlayerReligion newReligion) {

		if (player == null)
			return;

		if (!newReligion.getPlayer().equals(player))
			return;

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof Wonder) {
				item.setProductionModifier(-0.10F);
			}
		}
	}

	@Override
	public void onCityLooseMajorityReligion(City city, PlayerReligion oldReligion) {

		if (player == null)
			return;

		if (oldReligion == null)
			return;

		if (!oldReligion.getPlayer().equals(player))
			return;

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof Wonder) {
				item.setProductionModifier(0.10F);
			}
		}
	}
}
