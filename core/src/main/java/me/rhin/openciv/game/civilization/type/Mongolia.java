package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.mongolia.HorseIntegrationHeritage;
import me.rhin.openciv.game.player.AbstractPlayer;

public class Mongolia extends Civ {

	public Mongolia(AbstractPlayer player) {
		super(player);

		addHeritage(new HorseIntegrationHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_MONGOLIA;
	}

	@Override
	public Color getColor() {
		return new Color(0.061F, 0.191F, 0.209F, 1);
	}

	@Override
	public Color getBorderColor() {
		return Color.WHITE;
	}

	@Override
	public String getName() {
		return "Mongolia";
	}

}
