package me.rhin.openciv.server.game.religion.bonus.type;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.religion.bonus.IncreaseTileStatlineBonus;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class PantheonGodOfTheOpenSky extends ReligionBonus implements IncreaseTileStatlineBonus {

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileType(TileType.CATTLE_IMPROVED) || tile.containsTileType(TileType.HORSES_IMPROVED)
				|| tile.containsTileType(TileType.SHEEP_IMPROVED))
			statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

}
