package me.rhin.openciv.game.heritage.type.mamluks;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class IslamicScholarHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Islamic Scholars";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_SCIENCE.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "Gain 10% more science in\nthe capital.";
	}

	@Override
	protected void onStudied() {

	}

}
