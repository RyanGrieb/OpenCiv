package me.rhin.openciv.game.heritage.type.germany;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class BlitzkriegHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Blitzkrieg";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_MOVE.sprite();
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	public String getDesc() {
		return "All units get +1 movement.";
	}

	@Override
	protected void onStudied() {
	}
}
