package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class WheelTech extends Technology {

	public WheelTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 3));

		requiredTechs.add(AnimalHusbandryTech.class);
		requiredTechs.add(ArcheryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "The Wheel";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_WATERMILL.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks chariot archer\n" + "- Workers can build roads\n" + "- Unlocks water mill";
	}
}
