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

public class MathematicsTech extends Technology {

	public MathematicsTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(2, 3));

		requiredTechs.add(WheelTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Mathematics";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_MATHEMATICS.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The science of Mathematics is arguably the most important in all human history - laying the basis for exploring and understanding the physical world around us.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Catapult",
				"Hanging Gardens");

		// TODO: Add courthouse

		return unlockables;
	}
}
