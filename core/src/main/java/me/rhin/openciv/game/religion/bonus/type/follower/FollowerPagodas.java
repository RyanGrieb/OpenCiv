package me.rhin.openciv.game.religion.bonus.type.follower;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class FollowerPagodas extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.UI_ERROR;
	}

	@Override
	public String getName() {
		return "Pagodas";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.FOLLOWER_BELIEF;
	}

	@Override
	public String getDesc() {
		return "Use faith to purchase\nPagodas (200 Faith)";
	}

}
