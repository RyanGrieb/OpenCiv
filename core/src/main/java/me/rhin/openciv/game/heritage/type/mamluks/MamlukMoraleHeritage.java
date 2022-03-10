package me.rhin.openciv.game.heritage.type.mamluks;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class MamlukMoraleHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Mamluk Morale";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_HEART.sprite();
	}

	@Override
	public float getCost() {
		return 35;
	}

	@Override
	public String getDesc() {
		return "All units regenerate 10% more\nhealth.";
	}

	@Override
	protected void onStudied() {
		
	}

}
