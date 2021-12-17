package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class GuildsTech extends Technology {

	public GuildsTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.GOLD, TechProperty.HERITAGE, TechProperty.FAITH);

		requiredTechs.add(CurrencyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Guilds";
	}

}
