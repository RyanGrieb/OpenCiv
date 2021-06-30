package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;

public class SailingTech extends Technology {

	public SailingTech() {
		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Sailing";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_GALLEY.sprite();
	}

	@Override
	public String getDesc() {
		return "";
	}

}
