package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class DramaPoetryTech extends Technology {

	public DramaPoetryTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.HERITAGE);
	}

	@Override
	public int getScienceCost() {
		return 105;
	}

	@Override
	public String getName() {
		return "Drama and Poetry";
	}

}
