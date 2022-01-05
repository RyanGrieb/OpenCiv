package me.rhin.openciv.game.religion.bonus.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;

public class PantheonDesertFolklore extends ReligionBonus {

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.TILE_DESERT;
	}

	@Override
	public String getName() {
		return "Desert Folklore";
	}

	@Override
	public ReligionProperty getProperty() {
		return ReligionProperty.PANTHEON;
	}

	@Override
	public String getDesc() {
		return "+1 Faith from desert tiles\n";
	}

}
