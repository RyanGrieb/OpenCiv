package me.rhin.openciv.game.unit;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.AbstractPlayer;

public interface AttackableEntity {

	public boolean isUnitCapturable();

	public void setHealth(float health);

	public void setMaxHealth(float health);

	public float getHealth();

	public float getMaxHealth();

	public AbstractPlayer getPlayerOwner();

	public String getName();

	public Tile getTile();

	public void flashColor(Color red);

	public int getID();

}
