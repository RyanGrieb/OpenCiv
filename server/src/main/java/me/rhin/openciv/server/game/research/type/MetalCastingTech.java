package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class MetalCastingTech extends Technology {

	public MetalCastingTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.PRODUCTION, TechProperty.MILITARY);
		
		requiredTechs.add(IronWorkingTech.class);
		requiredTechs.add(EngineeringTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Metal Casting";
	}

}
