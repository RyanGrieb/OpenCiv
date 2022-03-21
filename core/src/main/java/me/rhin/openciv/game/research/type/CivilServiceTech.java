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

public class CivilServiceTech extends Technology {

	public CivilServiceTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 5));

		requiredTechs.add(HorsebackRidingTech.class);
		requiredTechs.add(CurrencyTech.class);
		requiredTechs.add(DramaPoetryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Civil Service";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_PIKEMAN.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Civil Service, the creation of the first true state organ, provides many benefits related with better food production.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Pikeman");

		// TODO: Add Chichen Itza

		return unlockables;
	}
}
