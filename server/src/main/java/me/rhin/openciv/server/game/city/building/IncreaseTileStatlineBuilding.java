package me.rhin.openciv.server.game.city.building;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.stat.StatLine;

public interface IncreaseTileStatlineBuilding {

	StatLine getTileStatline(Tile tile);

}
