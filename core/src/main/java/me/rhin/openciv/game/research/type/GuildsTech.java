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

public class GuildsTech extends Technology {

	public GuildsTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 3));

		requiredTechs.add(CurrencyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Guilds";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_MACHU_PICCHU.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Guilds are the first unions in history, an instance when entire class of workers in a particular branch organize and are able to better control their trade.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer()
				.getUnlockablesByName("Machu Picchu");

		// TODO: Add Trading post

		return unlockables;
	}

}
