package me.rhin.openciv.game.map.tile;

public enum ImprovementType {
	FARM("Building Farm", 5),
	MINE("Building Mine", 5),
	CHOP("Clearing Forest", 3);

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
