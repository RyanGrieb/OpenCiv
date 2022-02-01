package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.server.game.AbstractPlayer;

public abstract class PlayerNode extends Node {

	protected AbstractPlayer player;

	public PlayerNode(AbstractPlayer player, String name) {
		super(name);
		this.player = player;
	}

}
