package me.rhin.openciv.server.game.city;

import me.rhin.openciv.server.game.Player;

public class City {

	private Player playerOwner;

	public City(Player playerOwner) {
		this.playerOwner = playerOwner;
	}

	public Player getPlayerOwner() {
		return playerOwner;
	}
}
