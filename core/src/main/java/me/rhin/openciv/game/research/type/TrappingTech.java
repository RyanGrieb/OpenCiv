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
	public List<String> getDesc() {
		return Arrays.asList(
				"Some animals cannot be domesticated and grown in human-controlled environments - they need to be hunted in their natural habitats.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Circus");

		// TODO: Implement camp improvement

		return unlockables;
	}
}
