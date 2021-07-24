package me.rhin.openciv.game.heritage.type.all;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class TaxesHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Taxes";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_GOLD.sprite();
	}

}
