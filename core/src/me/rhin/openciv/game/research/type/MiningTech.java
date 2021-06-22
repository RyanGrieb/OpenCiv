package me.rhin.openciv.game.research.type;

import me.rhin.openciv.game.research.Technology;

public class MiningTech extends Technology {

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Mining";
	}
	
}
