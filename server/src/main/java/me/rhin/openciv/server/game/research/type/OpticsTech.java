package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class OpticsTech extends Technology {

	public OpticsTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.FOOD);

		requiredTechs.add(SailingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Optics";
	}
}
