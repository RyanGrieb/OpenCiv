package me.rhin.openciv.game.heritage.type.england;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class OceanTradeHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Ocean Trade";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_CARGO_SHIP.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "+1 Trade route for\nevery two costal cities.";
	}

	@Override
	protected void onStudied() {
	}
}
