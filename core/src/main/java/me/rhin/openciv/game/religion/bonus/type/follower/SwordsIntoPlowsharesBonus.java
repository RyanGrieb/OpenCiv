package me.rhin.openciv.game.religion.bonus.type.follower;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class SwordsIntoPlowsharesBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_FOOD;
	}

	@Override
	public String getName() {
		return "Swords Into Plowshares";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.FOLLOWER_BELIEF;
	}

	@Override
	public String getDesc() {
		return "15% faster growth if\ncity not at war";
	}

}
