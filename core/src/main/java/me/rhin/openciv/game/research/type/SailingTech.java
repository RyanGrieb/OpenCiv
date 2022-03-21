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

public class SailingTech extends Technology {

	public SailingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 9));

		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Sailing";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_GALLEY.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"One of the great achievements of early civilizations, Sailing develops the means to traverse the seas.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Work Boat", "Galley", "Cargo Ship");

		unlockables.add(new CustomUnlockable("Additional Trade Route", TextureEnum.ICON_BARREL,
				Arrays.asList("+1 Additional Trade Route")));

		return unlockables;
	}
}
