package me.rhin.openciv.game.heritage.type.rome;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;

public class LegionHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Roman Legions";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_ROME.sprite();
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	public String getDesc() {
		return "The largest military unit of \nthe roman army.\nAn enhanced version of swordsman.";
	}

	@Override
	protected void onStudied() {
	}
}
