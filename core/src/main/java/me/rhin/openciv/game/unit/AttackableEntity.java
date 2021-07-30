package me.rhin.openciv.game.unit;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public interface AttackableEntity {

	public int getCombatStrength(AttackableEntity targetEntity);

	public boolean isUnitCapturable();

	public void setHealth(float health);

	public void setMaxHealth(float health);

	public void setCombatStrength(int combatStrength);

	public float getHealth();

	public float getMaxHealth();

	public Player getPlayerOwner();

	public String getName();

	public Tile getTile();

	public void flashColor(Color red);

}
