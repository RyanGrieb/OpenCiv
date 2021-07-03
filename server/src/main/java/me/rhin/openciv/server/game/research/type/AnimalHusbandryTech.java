package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class AnimalHusbandryTech extends Technology {

	public AnimalHusbandryTech(ResearchTree researchTree) {
		super(researchTree);
	}

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Animal Husbandry";
	}
}
