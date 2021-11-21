package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class MasonryTech extends Technology {

	public MasonryTech(ResearchTree researchTree) {
		super(researchTree);

		requiredTechs.add(MiningTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Masonry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_PYRAMIDS.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks great pyramids\n- Build quarrys\n- Unlocks walls";
	}

}
