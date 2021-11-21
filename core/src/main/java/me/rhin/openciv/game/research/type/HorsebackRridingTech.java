package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class HorsebackRridingTech extends Technology {

	public HorsebackRridingTech(ResearchTree researchTree) {
		super(researchTree);

		requiredTechs.add(WheelTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Horseback Riding";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_HORSEMAN.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks horseman \n- Unlocks Stables";
	}

}
