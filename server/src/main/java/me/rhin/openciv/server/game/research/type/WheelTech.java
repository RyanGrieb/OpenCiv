package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.Technology;

public class WheelTech extends Technology {

	public WheelTech(ResearchTree researchTree) {
		super(researchTree);
		requiredTechs.add(AnimalHusbandryTech.class);
		requiredTechs.add(ArcheryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "The Wheel";
	}

}
