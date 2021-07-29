package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.rome.CapitalIconHeritage;
import me.rhin.openciv.game.heritage.type.rome.DefensiveLogisticsHeritage;
import me.rhin.openciv.game.heritage.type.rome.LegionHeritage;
import me.rhin.openciv.game.player.Player;

public class Rome extends Civ {

	/*
	 * Rome 25% Production to existing buildings in the capital, Builders can
	 * produce forts immediately, Legion Unit
	 */

	public Rome(Player player) {
		super(player);

		addHeritage(new LegionHeritage());
		addHeritage(new CapitalIconHeritage());
		addHeritage(new DefensiveLogisticsHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_ROME;
	}

	@Override
	public String getName() {
		return "Rome";
	}

	@Override
	public Color getColor() {
		return Color.PURPLE;
	}
}
