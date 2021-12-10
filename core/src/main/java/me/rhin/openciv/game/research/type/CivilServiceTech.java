package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class CivilServiceTech extends Technology {

	public CivilServiceTech(ResearchTree researchTree) {
		super(researchTree);

		requiredTechs.add(PhilosophyTech.class);
		requiredTechs.add(TrappingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Civil Service";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_PIKEMAN.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks pikeman\n- Unlocks Chichen Itza wonder";
	}

}
