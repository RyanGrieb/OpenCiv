package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.england.LineShipHeritage;
import me.rhin.openciv.game.heritage.type.england.OceanTradeHeritage;
import me.rhin.openciv.game.heritage.type.england.SailingHeritage;

public class England extends Civ {

	/*
	 * England Immediately have Sailing researched, Ship of the Line +1, Trade route
	 * for each city on the coastline with a strategic resource
	 */
	
	public England() {
		addHeritage(new LineShipHeritage());
		addHeritage(new OceanTradeHeritage());
		addHeritage(new SailingHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_ENGLAND;
	}

	@Override
	public String getName() {
		return "England";
	}

	@Override
	public Color getColor() {
		return Color.RED;
	}
}
