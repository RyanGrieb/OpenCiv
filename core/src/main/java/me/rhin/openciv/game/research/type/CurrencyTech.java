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

public class CurrencyTech extends Technology {

	public CurrencyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 3));

		this.requiredTechs.add(MathematicsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Currency";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_MARKET.sprite();
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"Currency, a single consolidated trading system based on one matrix material against which all others are judged.");
	}

	@Override
	public List<Unlockable> getUnlockables() {
		List<Unlockable> unlockables = Civilization.getInstance().getGame().getPlayer().getUnlockablesByName("Market",
				"Mint");

		return unlockables;
	}
}
