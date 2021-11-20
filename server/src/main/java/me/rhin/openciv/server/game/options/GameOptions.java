package me.rhin.openciv.server.game.options;

import java.util.HashMap;

public class GameOptions {

	private HashMap<GameOptionType, Integer> gameOptions;

	public GameOptions() {

		this.gameOptions = new HashMap<>();

		for (GameOptionType optionType : GameOptionType.values()) {
			gameOptions.put(optionType, optionType.getDefaultValue());
		}
	}

	public int getOption(GameOptionType optionType) {
		return gameOptions.get(optionType);
	}

	public void setOptionValue(GameOptionType optionType, int value) {
		gameOptions.put(optionType, value);
	}
}
