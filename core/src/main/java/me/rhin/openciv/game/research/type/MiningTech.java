package me.rhin.openciv.game.research.type;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.CustomUnlockable;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;
import me.rhin.openciv.game.research.Unlockable;

public class MiningTech extends Technology {

	public MiningTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(0, 1));
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Mining";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_MINING.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Mining develops the ability to extract mineral resources from the bowels of the earth.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = new ArrayList<>();

		unlockables.add(new CustomUnlockable("Mines", TextureEnum.TILE_IRON_IMPROVED,
				Arrays.asList("Enable builders to improve mineable tiles.")));

		unlockables.add(new CustomUnlockable("Clear Forests", TextureEnum.ICON_CHOP,
				Arrays.asList("Enable builders to remove forests.")));

		return unlockables;
	}
}
