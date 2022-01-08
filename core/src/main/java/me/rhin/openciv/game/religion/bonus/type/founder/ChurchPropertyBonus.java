package me.rhin.openciv.game.religion.bonus.type.founder;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class ChurchPropertyBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.TILE_CITY;
	}

	@Override
	public String getName() {
		return "Church Property";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.FOUNDER_BELIEF;
	}

	@Override
	public String getDesc() {
		return "+2 Gold for each city\nfollowing this Religion";
	}

}
