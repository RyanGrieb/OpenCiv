package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class HorsebackRidingTech extends Technology {

	public HorsebackRidingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(2, 5));

		requiredTechs.add(WheelTech.class);
		requiredTechs.add(TrappingTech.class);
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
