package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;

public interface TileObserver {

	public boolean ignoresTileObstructions();

	public void setIgnoresTileObstructions(boolean ignoresTileObstructions);

	public void addObeservedTile(Tile tile);

	public void removeObeservedTile(Tile tile);

	public String getName();

	public ArrayList<Tile> getObservedTiles();

}
