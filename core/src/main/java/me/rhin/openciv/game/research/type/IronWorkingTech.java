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

public class IronWorkingTech extends Technology {

	public IronWorkingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 0));

		requiredTechs.add(BronzeWorkingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 195;
	}

	@Override
	public String getName() {
		return "Iron Working";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_SWORDSMAN.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The discovery of iron, a metal much stronger than the bronze alloy used until that time, lays the groundwork for Iron Working and contemporary metallurgy.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Swordsman", "Colossus");

		// TODO: Add hero epic

		return unlockables;
	}
}
