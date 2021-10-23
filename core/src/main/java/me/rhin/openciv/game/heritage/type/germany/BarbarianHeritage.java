package me.rhin.openciv.game.heritage.type.germany;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class BarbarianHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Barbarian Heritage";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_CHOP.sprite();
	}

	@Override
	public float getCost() {
		return 8;
	}

	@Override
	public String getDesc() {
		return "Units have a 50% chance to \ncapture barbarian units.";
	}

	@Override
	protected void onStudied() {
	}
}
