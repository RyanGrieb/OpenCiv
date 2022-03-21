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

public class BronzeWorkingTech extends Technology {

	public BronzeWorkingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 0));

		requiredTechs.add(MiningTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override

	public String getName() {
		return "Bronze Working";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_SMELTER.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The first metal-working technology, Bronze Working provides your civilization with sturdy, durable tools and the first more serious weapons.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Spearman",
				"Statue Of Ares");

		//TODO: Add barracks
		
		unlockables.add(new CustomUnlockable("Clear Jungle", TextureEnum.ICON_CHOP,
				Arrays.asList("Enables builders to clear jungle tiles.")));

		return unlockables;
	}
}
