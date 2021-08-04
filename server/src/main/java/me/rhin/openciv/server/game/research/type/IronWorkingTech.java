package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class IronWorkingTech extends Technology {

	public IronWorkingTech(ResearchTree researchTree) {
		super(researchTree);

		requiredTechs.add(BronzeWorkingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 105; // 195
	}

	@Override
	public String getName() {
		return "Iron Working";
	}

}
