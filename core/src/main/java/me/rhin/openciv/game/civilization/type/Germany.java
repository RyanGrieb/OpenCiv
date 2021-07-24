package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;

public class Germany extends Civ {

	/*
	 * Nazi Germany 10% Production to military units, All military units have +1
	 * movement speed, Panzer Unit. Capture Barbarian units.
	 */
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
