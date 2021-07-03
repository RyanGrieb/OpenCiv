package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public class UnitParameter {

	private int id;
	private String unitName;
	private Tile standingTile;
	private Player playerOwner;

	public UnitParameter(int id, String unitName, Player playerOwner, Tile standingTile) {
		this.id = id;
		this.unitName = unitName;
		this.playerOwner = playerOwner;
		this.standingTile = standingTile;
	}

	public int getID() {
		return id;
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
