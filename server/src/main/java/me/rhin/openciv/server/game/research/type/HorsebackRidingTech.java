package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class HorsebackRidingTech extends Technology {

	public HorsebackRidingTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.MILITARY, TechProperty.PRODUCTION);

		requiredTechs.add(WheelTech.class);
		requiredTechs.add(TrappingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Horseback Riding";
	}

}