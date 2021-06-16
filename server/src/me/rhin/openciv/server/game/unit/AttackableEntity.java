package me.rhin.openciv.server.game.unit;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;

public interface AttackableEntity {

	public int getCombatStrength();

	public boolean isUnitCapturable();

	public float getHealth();

	public Player getPlayerOwner();

	public Tile getTile();

	public float getDamageTaken(AttackableEntity otherEntity);
}
