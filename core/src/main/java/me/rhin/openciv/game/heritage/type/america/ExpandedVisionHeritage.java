package me.rhin.openciv.game.heritage.type.america;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class ExpandedVisionHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Expanded Vision";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_SCOUT.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "All units gain +1 vision.";
	}

	@Override
	protected void onStudied() {
	}
}
