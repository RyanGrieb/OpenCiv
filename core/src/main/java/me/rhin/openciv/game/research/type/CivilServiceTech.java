package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class CivilServiceTech extends Technology {

	public CivilServiceTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 5));

		requiredTechs.add(HorsebackRidingTech.class);
		requiredTechs.add(CurrencyTech.class);
		requiredTechs.add(DramaPoetryTech.class);
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
