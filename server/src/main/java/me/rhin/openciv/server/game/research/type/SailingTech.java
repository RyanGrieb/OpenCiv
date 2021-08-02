package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.shared.stat.Stat;

public class SailingTech extends Technology {

	public SailingTech(ResearchTree researchTree) {
		super(researchTree);
		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public void onResearched() {
		researchTree.getPlayerOwner().getStatLine().addValue(Stat.MAX_TRADE_ROUTES, 1);
		researchTree.getPlayerOwner().updateOwnedStatlines(false);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Sailing";
	}
}
