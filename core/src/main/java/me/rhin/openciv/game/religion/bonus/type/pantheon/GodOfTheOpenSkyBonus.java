package me.rhin.openciv.game.religion.bonus.type.pantheon;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class GodOfTheOpenSkyBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.TILE_HORSES_IMPROVED;
	}

	@Override
	public String getName() {
		return "God of the Open Sky";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "+1 Culture from pastures\n";
	}

}
