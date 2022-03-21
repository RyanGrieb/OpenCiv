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

public class CalendarTech extends Technology {

	public CalendarTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(1, 8));

		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Calendar";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_CALENDAR.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"The invention of the Calendar allows your civilization to predict the approximate time of change of seasons - an ability essential for advanced agriculture.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Stoneworks", "Stonehenge");

		unlockables.add(new CustomUnlockable("Plantation", TextureEnum.TILE_COTTON_IMPROVED,
				Arrays.asList("Enables builders to construct plantations.")));

		return unlockables;
	}
}
