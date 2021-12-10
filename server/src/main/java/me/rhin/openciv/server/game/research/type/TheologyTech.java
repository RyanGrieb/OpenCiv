package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class TheologyTech extends Technology {

	public TheologyTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.FAITH);

		requiredTechs.add(PhilosophyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Theology";
	}

}
