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

public class AnimalHusbandryTech extends Technology {

	public AnimalHusbandryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(0, 5));
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Animal Husbandry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.TILE_HORSES.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks caravans\n" + "- Workers can build pastures\n+1 Trade route";
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Caravan");

		unlockables.add(
				new CustomUnlockable("Additional Trade Route", TextureEnum.ICON_BARREL, "+1 Additional Trade Route"));

		unlockables.add(new CustomUnlockable("Pastures", TextureEnum.ICON_PASTURE,
				"Improve horeses, cattle, and\nsheep tiles.\n\n+1 Production\n+1 Food for sheep"));

		return unlockables;
	}
}
