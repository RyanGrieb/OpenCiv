package me.rhin.openciv.game.map.tile;

public interface TileObserver {

	public boolean ignoresTileObstructions();

	public void setIgnoresTileObstructions(boolean ignoresTileObstructions);

}
