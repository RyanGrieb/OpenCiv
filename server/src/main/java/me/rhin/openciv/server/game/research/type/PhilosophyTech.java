package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class PhilosophyTech extends Technology {

	public PhilosophyTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.SCIENCE);

		requiredTechs.add(WritingTech.class);
		requiredTechs.add(CalendarTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Philosophy";
	}

}
