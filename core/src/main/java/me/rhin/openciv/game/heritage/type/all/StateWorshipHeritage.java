package me.rhin.openciv.game.heritage.type.all;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class StateWorshipHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "State Worship";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_MONUMENT.sprite();
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	public String getDesc() {
		return "Gain a free monument in all \nfuture and current cities.";
	}


	@Override
	protected void onStudied() {
	}
}
