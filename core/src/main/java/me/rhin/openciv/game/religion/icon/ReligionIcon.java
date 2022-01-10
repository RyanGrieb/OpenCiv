package me.rhin.openciv.game.religion.icon;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.util.StrUtil;

public enum ReligionIcon {

	PANTHEON(TextureEnum.ICON_PANTHEON),
	CHRISTIANITY(TextureEnum.ICON_CHRISTIANITY),
	ORTHODOXY(TextureEnum.ICON_ORTHODOX),
	ISLAM(TextureEnum.ICON_ISLAM),
	TAOISM(TextureEnum.ICON_TAOISM);

	private TextureEnum texture;

	ReligionIcon(TextureEnum texture) {
		this.texture = texture;
	}

	public TextureEnum getTexture() {
		return texture;
	}

	public String getName() {
		return StrUtil.capitalize(name().toLowerCase());
	}
}
