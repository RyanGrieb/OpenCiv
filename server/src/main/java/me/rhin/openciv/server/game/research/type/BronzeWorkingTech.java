package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class BronzeWorkingTech extends Technology {

	public BronzeWorkingTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.MILITARY, TechProperty.PRODUCTION);

		requiredTechs.add(MiningTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Bronze Working";
	}
}
