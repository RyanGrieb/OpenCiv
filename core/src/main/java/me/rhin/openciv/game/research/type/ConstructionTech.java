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

public class ConstructionTech extends Technology {

	public ConstructionTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(2, 1));

		requiredTechs.add(MasonryTech.class);
		requiredTechs.add(WheelTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Construction";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_HAMMER.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The Construction technology represents further advancements in building and combining materials.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Colosseum", "Composite Bowman");

		unlockables.add(new CustomUnlockable("Lumber Mill", TextureEnum.TILE_LUMBERMILL,
				Arrays.asList("Improve forest tiles.", "Provides +1 Production.")));

		// FIXME: Add terracota army.

		return unlockables;
	}

}
