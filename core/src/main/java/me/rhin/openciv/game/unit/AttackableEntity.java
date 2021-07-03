package me.rhin.openciv.game.unit;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;

public interface AttackableEntity {

	public int getCombatStrength();

	public boolean isUnitCapturable();

	public void setHealth(float health);

	public float getHealth();

	public float getMaxHealth();

	public Player getPlayerOwner();

	public String getName();

	public Tile getTile();

	public void flashColor(Color red);

}
