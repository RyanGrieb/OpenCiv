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

public class HorsebackRidingTech extends Technology {

	public HorsebackRidingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(2, 5));

		requiredTechs.add(WheelTech.class);
		requiredTechs.add(TrappingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Horseback Riding";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_HORSEMAN.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"With riding techniques, large animals that were previously used only for food or work can also be used as a means of transportation.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Horseman",
				"Stables");

		return unlockables;
	}
}
