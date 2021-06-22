package me.rhin.openciv.game.research.type;

import me.rhin.openciv.game.research.Technology;

public class SailingTech extends Technology {

	public SailingTech() {
		requiredTechs.add(PotteryTech.class);
	}

	@Override
	public int getScienceCost() {
		return 55;
	}

	@Override
	public String getName() {
		return "Sailing";
	}

}
