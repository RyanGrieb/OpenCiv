package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class WritingTech extends Technology {

	public WritingTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.SCIENCE);
		
		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Writing";
	}
}
