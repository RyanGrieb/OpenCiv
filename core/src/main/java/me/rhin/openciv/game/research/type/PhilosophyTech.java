package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class PhilosophyTech extends Technology {

	public PhilosophyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 8));

		requiredTechs.add(WritingTech.class);
		requiredTechs.add(CalendarTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Philosophy";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_NATIONAL_COLLEGE.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks National College";
	}

}
