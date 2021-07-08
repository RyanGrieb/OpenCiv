package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;

public class WritingTech extends Technology {

	public WritingTech() {
		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Writing";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_LIBRARY.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks great library\n" + "- Unlocks library\n" + "- Unlocks embassies";
	}
}
