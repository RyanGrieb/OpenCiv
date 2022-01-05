package me.rhin.openciv.game.religion.bonus.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class PantheonGodOfTheSea extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.UNIT_WORK_BOAT;
	}

	@Override
	public String getName() {
		return "God of the Sea";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "+1 Production from\nworkboats";
	}

}
