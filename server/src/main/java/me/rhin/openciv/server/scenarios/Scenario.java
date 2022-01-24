package me.rhin.openciv.server.scenarios;

public abstract class Scenario {

	public abstract void toggle();

	/**
	 * Returns if the command can only be toggled in the pre-game lobby
	 * 
	 * @return
	 */
	public abstract boolean preGameOnly();

}
