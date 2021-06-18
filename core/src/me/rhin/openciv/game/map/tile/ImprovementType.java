package me.rhin.openciv.game.map.tile;

import me.rhin.openciv.shared.util.StrUtil;

public enum ImprovementType {
	FARM(5),
	MINE(5);

	private int maxTurns;

	ImprovementType(int turns) {
		maxTurns = turns;
	}

	public String getName() {
		return StrUtil.capitalize(name().toLowerCase());
	}

	public int getMaxTurns() {
		return maxTurns;
	}
}
