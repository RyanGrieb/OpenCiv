package me.rhin.openciv.game.heritage.type.mamluks;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class BazaarHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Bazaars";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_GOLD.sprite();
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	public String getDesc() {
		return "Replaces the market building\nwith the Bazaar.";
	}

	@Override
	protected void onStudied() {
	}

}
