package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class MiningTech extends Technology {

	public MiningTech(ResearchTree researchTree) {
		super(researchTree);
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Mining";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_MINING.sprite();
	}

	@Override
	public String getDesc() {
		return "- Workers can build mines\n" + "- Workers can clear forests";
	}
}
