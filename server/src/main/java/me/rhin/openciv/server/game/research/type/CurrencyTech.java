package me.rhin.openciv.server.game.research.type;

import me.rhin.openciv.server.game.research.ResearchTree;
import me.rhin.openciv.server.game.research.TechProperty;
import me.rhin.openciv.server.game.research.Technology;

public class CurrencyTech extends Technology {

	public CurrencyTech(ResearchTree researchTree) {
		super(researchTree, TechProperty.GOLD);
		
		this.requiredTechs.add(MathematicsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Currency";
	}

}
