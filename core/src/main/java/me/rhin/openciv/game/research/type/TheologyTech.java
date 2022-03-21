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

public class TheologyTech extends Technology {

	public TheologyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 8));

		requiredTechs.add(PhilosophyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Theology";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_GARDEN.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The scientific approach to spirituality gives birth to Theology, the ultimate development of religion, which now turns into an object of research and speculation beyond simple beliefs.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Garden");

		// TODO: Add grand temple, Hagia Sophia, Borobudur

		return unlockables;
	}
}
