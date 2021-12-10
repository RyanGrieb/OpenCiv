package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class SailingTech extends Technology {

	public SailingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 9));

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
		return "- Unlocks work boat\n" + "- Unlocks galley\n" + "- Unlocks cargo ship\n" + "+1 Trade route";
	}
}
