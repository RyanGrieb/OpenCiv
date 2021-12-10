package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class TrappingTech extends Technology {

	public TrappingTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.MORALE);
		
		requiredTechs.add(AnimalHusbandryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Trapping";
	}
}
