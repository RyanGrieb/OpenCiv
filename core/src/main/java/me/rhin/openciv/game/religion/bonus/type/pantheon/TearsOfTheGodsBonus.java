package me.rhin.openciv.game.religion.bonus.type.pantheon;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class TearsOfTheGodsBonus extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.TILE_GEMS;
	}

	@Override
	public String getName() {
		return "Tears of the Gods";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "+2 Faith from gems\n";
	}


}
