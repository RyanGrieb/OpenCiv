package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class ConstructionTech extends Technology {

	public ConstructionTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.MILITARY, TechProperty.MORALE, TechProperty.PRODUCTION);

		requiredTechs.add(MasonryTech.class);
		requiredTechs.add(WheelTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Construction";
	}

}
