package me.rhin.openciv.server.game.civilization;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.TileType;

public abstract class Civ {

	protected Player player;

	public Civ(Player player) {
		this.player = player;
	}

	public abstract String getName();
	
	public abstract void initHeritage();

	public TileType getBiasTileType() {
		return null;
	}

	protected void addHeritage(Heritage heritage) {
		System.out.println("Adding: " + heritage.getName());
		player.getHeritageTree().addHeritage(heritage);
	}
}
