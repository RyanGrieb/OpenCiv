package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class CalendarTech extends Technology {

	public CalendarTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.PRODUCTION, TechProperty.FAITH);

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
}
