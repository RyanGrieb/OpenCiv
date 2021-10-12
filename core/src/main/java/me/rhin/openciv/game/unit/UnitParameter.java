package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.player.Player;

public class UnitParameter {

	private int id;
	private String unitName;
	private Tile standingTile;
	private AbstractPlayer playerOwner;

	public UnitParameter(int id, String unitName, AbstractPlayer playerOwner, Tile standingTile) {
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

	public AbstractPlayer getPlayerOwner() {
		return playerOwner;
	}

	public Tile getStandingTile() {
		return standingTile;
	}
}
