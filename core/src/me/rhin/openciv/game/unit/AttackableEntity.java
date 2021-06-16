package me.rhin.openciv.game.unit;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public interface AttackableEntity {

	public int getCombatStrength();

	public boolean isUnitCapturable();

	public float getHealth();

	public float getMaxHealth();

	public Player getPlayerOwner();

	public String getName();

	public Tile getTile();

}
