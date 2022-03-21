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

public class WheelTech extends Technology {

	public WheelTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 3));

		requiredTechs.add(AnimalHusbandryTech.class);
		requiredTechs.add(ArcheryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "The Wheel";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_WATERMILL.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The Wheel is another key technology, which fundamentally changes the way humans move around and transport things.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Water Mill", "Chariot Archer");

		unlockables.add(new CustomUnlockable("Roads", TextureEnum.ROAD_HORIZONTAL,
				Arrays.asList("Enables builders to construct roads.")));

		return unlockables;
	}
}
