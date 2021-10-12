package me.rhin.openciv.server.game.unit;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;

public interface AttackableEntity {

	public float getCombatStrength(AttackableEntity targetEntity);

	public boolean isUnitCapturable();

	public float getHealth();

	public AbstractPlayer getPlayerOwner();

	public Tile getTile();

	public float getDamageTaken(AttackableEntity otherEntity, boolean entityDefending);

	public boolean surviveAttack(AttackableEntity otherEntity);

	public void setHealth(float health);

	public void onCombat();

}
