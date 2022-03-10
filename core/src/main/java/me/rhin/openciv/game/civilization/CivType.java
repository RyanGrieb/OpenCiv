package me.rhin.openciv.game.civilization;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.util.StrUtil;

public enum CivType {

	RANDOM(TextureEnum.ICON_UNKNOWN),
	AMERICA(TextureEnum.ICON_AMERICA),
	ENGLAND(TextureEnum.ICON_ENGLAND),
	GERMANY(TextureEnum.ICON_GERMANY),
	ROME(TextureEnum.ICON_ROME),
	MAMLUKS(TextureEnum.ICON_MAMLUKS);

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
