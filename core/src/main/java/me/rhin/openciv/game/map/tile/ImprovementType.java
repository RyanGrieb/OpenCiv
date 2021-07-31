package me.rhin.openciv.game.map.tile;

public enum ImprovementType {
	FARM("Building Farm", 5),
	MINE("Building Mine", 5),
	PASTURE("Building Pasture", 5),
	CHOP("Clearing Forest", 3),
	PLANTATION("Building Plantation", 5),
	ROAD("Building Road", 3),
	CLEAR("Clearing Jungle", 3);

	private String improvementDesc;
	private int maxTurns;

	ImprovementType(String desc, int turns) {
		improvementDesc = desc;
		maxTurns = turns;
	}

	public String getImprovementDesc() {
		return improvementDesc;
	}

	public int getMaxTurns() {
		return maxTurns;
	}
}
