package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class ArcheryTech extends Technology {

	public ArcheryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(0, 3));
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Archery";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_ARCHER.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks archers";
	}

}
