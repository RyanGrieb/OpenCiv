package me.rhin.openciv.game.heritage.type.rome;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class DefensiveLogisticsHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Defensive Logistics";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_SHIELD.sprite();
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	public String getDesc() {
		return "Builders can build forts.";
	}

	@Override
	protected void onStudied() {
	}
}
