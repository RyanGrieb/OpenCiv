package me.rhin.openciv.server.game.religion.bonus.type;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.religion.bonus.IncreaseTileStatlineBonus;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class PantheonReligiousIdols extends ReligionBonus implements IncreaseTileStatlineBonus {

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileType(TileType.GOLD) || tile.containsTileType(TileType.SILVER)
				|| tile.containsTileType(TileType.GOLD_IMPROVED) || tile.containsTileType(TileType.SILVER_IMPROVED)) {
			statLine.addValue(Stat.HERITAGE_GAIN, 1);
			statLine.addValue(Stat.FAITH_GAIN, 1);
		}

		return statLine;
	}

}
