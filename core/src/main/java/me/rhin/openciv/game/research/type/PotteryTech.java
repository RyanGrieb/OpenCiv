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

public class PotteryTech extends Technology {

	public PotteryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(0, 8));
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Pottery";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_GRANARY.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"As the art of building objects from clay, Pottery is also a fundament of civilization, creating the means for long-term storage of food and materials and their protection from the elements.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		return Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Granary", "Shrine", "Chapel");
	}
}
