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
	public List<String> getDesc() {
		return Arrays.asList(
				"A cornerstone of human development, Animal Husbandry allows the access to various animal resources via the Pasture.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Caravan");

		unlockables.add(new CustomUnlockable("Additional Trade Route", TextureEnum.ICON_BARREL,
				Arrays.asList("+1 Additional Trade Route")));

		unlockables.add(new CustomUnlockable("Pastures", TextureEnum.ICON_PASTURE,
				Arrays.asList("Improve horeses, cattle, and sheep tiles.", "+1 Production", "+1 Food for sheep")));

		return unlockables;
	}
}
