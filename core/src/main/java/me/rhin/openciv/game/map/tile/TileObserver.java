package me.rhin.openciv.game.map.tile;

import me.rhin.openciv.game.player.AbstractPlayer;

public interface TileObserver {
	public boolean ignoresTileObstructions();

	public void setIgnoresTileObstructions(boolean ignoresTileObstructions);

	public int getID();

	public AbstractPlayer getPlayerOwner();

}
