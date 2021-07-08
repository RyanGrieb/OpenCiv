package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;

public class TrappingTech extends Technology {

	public TrappingTech() {
		requiredTechs.add(AnimalHusbandryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Trapping";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UI_ERROR.sprite();
	}

	@Override
	public String getDesc() {
		return "- Workers can build camps\n" + "- Unlocks circus";
	}
}
