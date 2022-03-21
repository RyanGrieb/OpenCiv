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

public class ArcheryTech extends Technology {

	public ArcheryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(0, 3));
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Archery";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_ARCHER.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Archery, the technology to develop the first ranged weapons, is one of the most important achievements of early human civilization.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		return Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Archer");
	}

}
