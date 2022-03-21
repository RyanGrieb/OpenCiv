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

public class MetalCastingTech extends Technology {

	public MetalCastingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 1));

		requiredTechs.add(IronWorkingTech.class);
		requiredTechs.add(EngineeringTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Metal Casting";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_FORGE.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The next advancement in the metal-working technology, Metal Casting brings the concept of the mold as means of creating oddly-shaped metallic objects.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Forge",
				"Workshop");

		// TODO: Add Trading post

		return unlockables;
	}
}
