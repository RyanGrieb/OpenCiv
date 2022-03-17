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

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	public String getDesc() {
		return "+1 Gold for every 2 citizens\nin cities.";
	}

	@Override
	protected void onStudied() {
	}
}
