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

public class MasonryTech extends Technology {

	public MasonryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 1));

		requiredTechs.add(MiningTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Masonry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_PYRAMIDS.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays
				.asList("Masonry is the art of building massive stone structures, and working with stone in general.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Walls",
				"Great Pyramids");

		unlockables.add(new CustomUnlockable("Quarry", TextureEnum.TILE_MARBLE_IMPROVED,
				Arrays.asList("Enables builders to improve marble or stone tiles.")));

		return unlockables;
	}
}
