package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public class UnitParameter {

	private String unitName;
	private Tile standingTile;
	private Player playerOwner;

	public UnitParameter(String unitName, Player playerOwner, Tile standingTile) {
		this.unitName = unitName;
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
	}

	public String getUnitName() {
		return unitName;
	}

	public Player getPlayerOwner() {
		return playerOwner;
	}

	public Tile getStandingTile() {
		return standingTile;
	}
}
