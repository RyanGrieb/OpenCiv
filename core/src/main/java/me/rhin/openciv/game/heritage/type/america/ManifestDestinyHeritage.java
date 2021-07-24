package me.rhin.openciv.game.heritage.type.america;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public class ManifestDestinyHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Manifest Destiny";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_SETTLER.sprite();
	}

}
