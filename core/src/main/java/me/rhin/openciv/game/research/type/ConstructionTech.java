package me.rhin.openciv.game.research.type;

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
	public String getDesc() {
		return "- Builders can build lumber \nmills\n- Unlocks Colosseum\n- Unlocks Terracotta Army\n- Unlocks composite bowman";
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Colosseum", "Composite Bowman");

		unlockables.add(new CustomUnlockable("Lumber Mill", TextureEnum.TILE_LUMBERMILL,
				"Improve forest tiles.\n+1 Production"));

		// FIXME: Add terracota army.

		return unlockables;
	}

}
