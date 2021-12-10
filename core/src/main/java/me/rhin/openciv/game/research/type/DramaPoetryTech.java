package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class DramaPoetryTech extends Technology {

	public DramaPoetryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 7));

		requiredTechs.add(WritingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Drama and Poetry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_AMPHITHEATER.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks amphitheater\nbuilding";
	}

}
