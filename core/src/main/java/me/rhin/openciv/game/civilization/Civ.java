package me.rhin.openciv.game.civilization;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.player.AbstractPlayer;

public abstract class Civ {

	private AbstractPlayer player;

	public Civ(AbstractPlayer player) {
		this.player = player;
	}

	public abstract TextureEnum getIcon();

	public abstract Color getColor();
	public abstract Color getBorderColor();

	public abstract String getName();

	protected void addHeritage(Heritage heritage) {
		if (!player.equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		player.getHeritageTree().addHeritage(heritage);
	}
}
