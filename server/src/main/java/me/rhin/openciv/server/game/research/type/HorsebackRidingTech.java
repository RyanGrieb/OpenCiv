package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class HorsebackRidingTech extends Technology {

	public HorsebackRidingTech(ResearchTree researchTree) {
		super(researchTree);

		requiredTechs.add(WheelTech.class);
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