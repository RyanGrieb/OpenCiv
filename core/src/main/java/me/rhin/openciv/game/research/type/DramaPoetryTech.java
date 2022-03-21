package me.rhin.openciv.game.research.type;

import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;
import me.rhin.openciv.game.research.Unlockable;

public class DramaPoetryTech extends Technology {

	public DramaPoetryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 7));

		requiredTechs.add(WritingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Drama and Poetry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_AMPHITHEATER.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The antique drama is the first advanced form of art developed by man, influencing even civilizations in much later ages.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Amphitheater");


		// FIXME: Add national epic, partheon

		return unlockables;
	}
}
