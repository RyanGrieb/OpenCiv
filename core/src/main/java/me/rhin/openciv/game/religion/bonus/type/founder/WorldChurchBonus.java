package me.rhin.openciv.game.religion.bonus.type.founder;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class WorldChurchBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_HERITAGE;
	}

	@Override
	public String getName() {
		return "World Church";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.FOUNDER_BELIEF;
	}

	@Override
	public String getDesc() {
		return "+1 Heritage for every 5\nfollowers of this Religion\nin other Civilizations";
	}

}
