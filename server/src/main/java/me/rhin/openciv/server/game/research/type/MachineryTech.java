package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class MachineryTech extends Technology {

	public MachineryTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.MILITARY, TechProperty.PRODUCTION);

		requiredTechs.add(EngineeringTech.class);
		requiredTechs.add(GuildsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 485;
	}

	@Override
	public String getName() {
		return "Machinery";
	}

}
