package me.rhin.openciv.game.heritage.type.england;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class OceanTradeHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Ocean Trade";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_GOLD.sprite();
	}

}
