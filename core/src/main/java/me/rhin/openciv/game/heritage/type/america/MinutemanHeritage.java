package me.rhin.openciv.game.heritage.type.america;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class MinutemanHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 2;
	}

	@Override
	public String getName() {
		return "Minuteman";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UI_ERROR.sprite();
	}

	@Override
	public float getCost() {
		return 60;
	}

	@Override
	public String getDesc() {
		return "Unique mele unit.\nReplaces the musketman.";
	}

	@Override
	protected void onStudied() {
	}
}
