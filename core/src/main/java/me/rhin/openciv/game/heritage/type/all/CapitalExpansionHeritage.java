package me.rhin.openciv.game.heritage.type.all;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class CapitalExpansionHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Expansion";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_FOOD.sprite();
	}

}
