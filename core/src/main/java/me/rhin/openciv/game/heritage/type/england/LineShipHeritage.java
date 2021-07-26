package me.rhin.openciv.game.heritage.type.england;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class LineShipHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Ship of the Line";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_WORK_BOAT.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "A unique naval unit.\nReplaces caravel.";
	}

	@Override
	protected void onStudied() {
	}
}
