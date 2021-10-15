package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.player.AbstractPlayer;

public class Barbarians extends Civ {

	/*
	 * All units have +1 vision, 25% production to settlers, American musketmen
	 */
	public Barbarians(AbstractPlayer player) {
		super(player);
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_BARBARIAN;
	}

	@Override
	public String getName() {
		return "Barbarians";
	}

	@Override
	public Color getColor() {
		return Color.FIREBRICK;
	}
}