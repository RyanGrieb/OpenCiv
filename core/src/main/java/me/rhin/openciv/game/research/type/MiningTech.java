package me.rhin.openciv.game.research.type;

import java.util.ArrayList;
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
	public String getDesc() {
		return "- Workers can build mines\n" + "- Workers can clear forests";
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = new ArrayList<>();

		unlockables.add(new CustomUnlockable("Mines", TextureEnum.TILE_IRON_IMPROVED,
				"Enable builders to improve\nmineable tiles."));

		unlockables.add(
				new CustomUnlockable("Clear Forests", TextureEnum.ICON_CHOP, "Enable builders to remove\nforests."));

		return unlockables;
	}
}
