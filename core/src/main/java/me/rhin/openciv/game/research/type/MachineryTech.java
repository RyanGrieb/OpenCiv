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

public class MachineryTech extends Technology {

	public MachineryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(5, 2));

		requiredTechs.add(EngineeringTech.class);
		requiredTechs.add(GuildsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 485;
	}

	@Override
	public String getName() {
		return "Machinery";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_CROSSBOWMAN.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Previous advances in metal working and science give birth to the concept of a machine, a device with multiple moving parts which work together to achieve a certain end.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Crossbowman");

		// TODO: Add Ironworks & faster roads.

		return unlockables;
	}
}
