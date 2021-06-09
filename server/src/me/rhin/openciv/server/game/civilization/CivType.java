package me.rhin.openciv.server.game.civilization;

import java.util.Random;

public enum CivType {

	RANDOM,
	AMERICA,
	ENGLAND,
	GERMANY,
	ROME;

	public static CivType randomCiv() {
		Random rnd = new Random();
		int max = CivType.values().length - 1;
		int min = 1;
		// CivType civType = CivType.values()[rnd.nextInt(max - min + 1) + min];
		CivType civType = CivType.values()[rnd.nextInt(CivType.values().length - 2) + 1];
		return civType;
	}

}
