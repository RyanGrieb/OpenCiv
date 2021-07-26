package me.rhin.openciv.game.civilization;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;

public abstract class Civ {

	public abstract TextureEnum getIcon();

	public abstract Color getColor();

	public abstract String getName();

	protected void addHeritage(Heritage heritage) {
		Civilization.getInstance().getGame().getPlayer().getHeritageTree().addHeritage(heritage);
	}
}
