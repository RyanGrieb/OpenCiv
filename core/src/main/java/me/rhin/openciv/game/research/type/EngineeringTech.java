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

public class EngineeringTech extends Technology {

	public EngineeringTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 2));

		requiredTechs.add(MathematicsTech.class);
		requiredTechs.add(ConstructionTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Engineering";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_AQUEDUCT.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Engineering is the next step in practical building."
				+ " Thanks to it, and mathematics, men learn to design complex structures and machines without having to actually build them to see them working.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Aqueduct");

		unlockables.add(new CustomUnlockable("Additional Trade Route", TextureEnum.ICON_BARREL,
				Arrays.asList("+1 Additional Trade Route")));

		return unlockables;
	}
}
