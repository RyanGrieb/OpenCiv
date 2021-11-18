package me.rhin.openciv.server.game.map.tile;

public interface TileObserver {

	public boolean ignoresTileObstructions();

	public void setIgnoresTileObstructions(boolean ignoresTileObstructions);

	public void addObeservedTile(Tile tile);

	public void removeObeservedTile(Tile tile);

}
