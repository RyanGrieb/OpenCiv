package me.rhin.openciv.server.game.religion.bonus.type;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.religion.bonus.IncreaseTileStatlineBonus;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class PantheonGodOfTheSea extends ReligionBonus implements IncreaseTileStatlineBonus {

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();
		
		if (tile.containsTileType(TileType.FISH_IMPROVED) || tile.containsTileType(TileType.CRABS_IMPROVED))
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		
		return statLine;
	}

}
