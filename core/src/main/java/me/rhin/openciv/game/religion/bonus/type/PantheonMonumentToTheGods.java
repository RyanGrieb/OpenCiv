package me.rhin.openciv.game.religion.bonus.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.listener.CityGainMajorityReligionListener;
import me.rhin.openciv.listener.CityLooseMajorityReligionListener;

public class PantheonMonumentToTheGods extends ReligionBonus
		implements CityGainMajorityReligionListener, CityLooseMajorityReligionListener {

	public PantheonMonumentToTheGods() {
		// FIXME: Assign these when were assigned a player?
		Civilization.getInstance().getEventManager().addListener(CityGainMajorityReligionListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityLooseMajorityReligionListener.class, this);
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

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.BUILDING_STATUE_OF_ARES;
	}

	@Override
	public String getName() {
		return "Monument to the Gods";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "10% Production towards wonders\n";
	}

	// FIXME: Implement gainReligionMajority(City city)
	// FIXME: Implement looseReligionMajority(City city)
}
