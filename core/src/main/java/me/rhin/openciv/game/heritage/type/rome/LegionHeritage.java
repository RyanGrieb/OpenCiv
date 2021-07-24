package me.rhin.openciv.game.heritage.type.rome;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class LegionHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Roman Legions";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_ROME.sprite();
	}

}
