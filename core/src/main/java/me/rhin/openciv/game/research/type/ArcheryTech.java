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
import me.rhin.openciv.game.unit.type.Archer;

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
	public String getDesc() {
		return "- Unlocks archers";
	}

	@Override
	public List<Unlockable> getUnlockables() {
		return Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Archer");
	}

}
