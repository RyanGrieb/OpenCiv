package me.rhin.openciv.game.research.type;

import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.CustomUnlockable;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;
import me.rhin.openciv.game.research.Unlockable;

public class PhilosophyTech extends Technology {

	public PhilosophyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 8));

		requiredTechs.add(WritingTech.class);
		requiredTechs.add(CalendarTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
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
	public List<String> getDesc() {
		return Arrays.asList(
				"Philosophy is the first abstract science developed by man."
				+ " By delving into concepts which are not immediately present in the surrounding world, it allows civilization to further advance its intellectual power.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("National College");


		// FIXME: Add temple & oracle.

		return unlockables;
	}
}
