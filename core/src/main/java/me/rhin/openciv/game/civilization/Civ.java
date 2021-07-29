package me.rhin.openciv.game.civilization;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.player.Player;

public abstract class Civ {

	private Player player;

	public Civ(Player player) {
		this.player = player;
	}

	public abstract TextureEnum getIcon();

	public abstract Color getColor();

	public abstract String getName();

	protected void addHeritage(Heritage heritage) {
		if (!player.equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		player.getHeritageTree().addHeritage(heritage);
	}
}
