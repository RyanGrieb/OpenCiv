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

public class OpticsTech extends Technology {

	public OpticsTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(2, 9));

		requiredTechs.add(SailingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 85;
	}

	@Override
	public String getName() {
		return "Optics";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_LIGHTHOUSE.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Optics, the development of tools that allow humans to see much farther away than normally possible, enables a number of technological advancements in seafaring.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Lighthouse");

		// TODO: Add barracks

		unlockables.add(new CustomUnlockable("Transport Ship", TextureEnum.UNIT_TRANSPORT_SHIP, Arrays.asList(
				"Enables units to traverse shallow water. To use, move a unit ajacent to a water tile and click the action button.")));

		return unlockables;
	}
}
