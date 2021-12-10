package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class TrappingTech extends Technology {

	public TrappingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 5));

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
		return TextureEnum.BUILDING_CIRCUS.sprite();
	}

	@Override
	public String getDesc() {
		return "- Workers can build camps\n" + "- Unlocks circus";
	}
}
