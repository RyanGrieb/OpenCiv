package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;

public class CalendarTech extends Technology {

	public CalendarTech() {
		requiredTechs.add(PotteryTech.class);
	}
	
	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Calendar";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UI_ERROR.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks stone works\n" + "- Unlocks stonehenge\n" + "- Build plantations";
	}

}
