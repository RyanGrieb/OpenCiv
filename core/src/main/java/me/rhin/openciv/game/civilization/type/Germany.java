package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.germany.BarbarianHeritage;
import me.rhin.openciv.game.heritage.type.germany.BlitzkriegHeritage;
import me.rhin.openciv.game.heritage.type.germany.DisciplineHeritage;
import me.rhin.openciv.game.player.AbstractPlayer;

public class Germany extends Civ {

	/*
	 * Germany 10% Production to military units, All military units have +1 movement
	 * speed, Panzer Unit. Capture Barbarian units.
	 */
	public Germany(AbstractPlayer player) {
		super(player);

		addHeritage(new BarbarianHeritage());
		addHeritage(new BlitzkriegHeritage());
		addHeritage(new DisciplineHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_GERMANY;
	}

	@Override
	public String getName() {
		return "Germany";
	}

	@Override
	public Color getColor() {
		return Color.GRAY;
	}
}
