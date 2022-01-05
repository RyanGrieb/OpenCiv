package me.rhin.openciv.game.religion.bonus.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class PantheonReligiousIdols extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.TILE_GOLD;
	}

	@Override
	public String getName() {
		return "Religious Idols";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "+1 Culture & Faith for\neach gold & silver tile";
	}

}
