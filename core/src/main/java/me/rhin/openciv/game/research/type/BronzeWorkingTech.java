package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class BronzeWorkingTech extends Technology {

	public BronzeWorkingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 0));
		
		requiredTechs.add(MiningTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override

	public String getName() {
		return "Bronze Working";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_SMELTER.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks spearman\n" + "- Unlocks barracks\n" + "- Unlocks statue of Ares\n"
				+ "- Workers can clear jungle";
	}

}
