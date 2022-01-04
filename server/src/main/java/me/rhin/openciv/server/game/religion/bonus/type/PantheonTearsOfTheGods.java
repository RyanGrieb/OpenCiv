package me.rhin.openciv.server.game.religion.bonus.type;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.religion.bonus.IncreaseTileStatlineBonus;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class PantheonTearsOfTheGods extends ReligionBonus implements IncreaseTileStatlineBonus {

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileType(TileType.GEMS) || tile.containsTileType(TileType.GEMS_IMPROVED))
			statLine.addValue(Stat.FAITH_GAIN, 2);

		return statLine;
	}

}
