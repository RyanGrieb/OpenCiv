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

public class WritingTech extends Technology {

	public WritingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 7));

		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Writing";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_LIBRARY.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"One of the cornerstones of civilization, Writing is the ability to transfer information to durable materials (stone, paper), and thus preserve it for the generations.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Library",
				"Great Library");

		return unlockables;
	}
}
