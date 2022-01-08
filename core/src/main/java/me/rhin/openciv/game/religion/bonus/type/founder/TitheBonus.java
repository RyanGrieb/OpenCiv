package me.rhin.openciv.game.religion.bonus.type.founder;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class TitheBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_CITIZEN;
	}

	@Override
	public String getName() {
		return "Tithe";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.FOUNDER_BELIEF;
	}

	@Override
	public String getDesc() {
		return "+1 Gold for every 4\nfollowers of this Religion";
	}

}
