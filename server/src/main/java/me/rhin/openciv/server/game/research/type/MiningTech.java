package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class MiningTech extends Technology {

	public MiningTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.PRODUCTION);
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Mining";
	}
}
