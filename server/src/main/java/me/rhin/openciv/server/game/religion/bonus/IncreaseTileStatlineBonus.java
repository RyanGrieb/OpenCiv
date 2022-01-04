package me.rhin.openciv.server.game.religion.bonus;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.stat.StatLine;

public interface IncreaseTileStatlineBonus {

	public StatLine getAddedStatline(Tile tile);
	
}
