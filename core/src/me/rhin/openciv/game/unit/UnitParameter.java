package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public class UnitParameter {

	private Tile standingTile;
	private Player playerOwner;

	public UnitParameter(Player playerOwner, Tile standingTile) {
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
	}

	public Tile getStandingTile() {
		return standingTile;
	}

	public Player getPlayerOwner() {
		return playerOwner;
	}
}
