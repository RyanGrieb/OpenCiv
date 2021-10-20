package me.rhin.openciv.game.civilization;

import java.util.Random;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.type.America;
import me.rhin.openciv.game.civilization.type.Barbarians;
import me.rhin.openciv.game.civilization.type.CityState;
import me.rhin.openciv.game.civilization.type.England;
import me.rhin.openciv.game.civilization.type.Germany;
import me.rhin.openciv.game.civilization.type.Rome;
import me.rhin.openciv.game.civilization.type.CityState.CityStateType;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.util.StrUtil;

public enum CivType {

	RANDOM(TextureEnum.ICON_UNKNOWN),
	AMERICA(TextureEnum.ICON_AMERICA),
	ENGLAND(TextureEnum.ICON_ENGLAND),
	GERMANY(TextureEnum.ICON_GERMANY),
	ROME(TextureEnum.ICON_ROME);

	private TextureEnum icon;

	CivType(TextureEnum civIcon) {
		icon = civIcon;
	}

	public TextureEnum getIcon() {
		return icon;
	}

	public String getName() {
		return StrUtil.capitalize(name().toLowerCase());
	}
}
