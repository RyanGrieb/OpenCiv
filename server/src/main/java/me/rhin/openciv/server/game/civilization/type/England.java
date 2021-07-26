package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.england.LineShipHeritage;
import me.rhin.openciv.server.game.heritage.type.england.OceanTradeHeritage;
import me.rhin.openciv.server.game.heritage.type.england.SailingHeritage;
import me.rhin.openciv.server.game.map.tile.TileType;

public class England extends Civ {

	/*
	 * England Immediately have Sailing researched, Ship of the Line +1, Trade route
	 * for each city on the coastline with a strategic resource
	 */

	public England(Player player) {
		super(player);

		addHeritage(new LineShipHeritage(player));
		addHeritage(new OceanTradeHeritage(player));
		addHeritage(new SailingHeritage(player));
	}

	@Override
	public String getName() {
		return "England";
	}

	@Override
	public TileType getBiasTileType() {
		return TileType.SHALLOW_OCEAN;
	}

}
