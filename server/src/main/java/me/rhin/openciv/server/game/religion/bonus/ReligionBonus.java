package me.rhin.openciv.server.game.religion.bonus;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;

public abstract class ReligionBonus {

	private AbstractPlayer player;
	
	public AbstractPlayer getPlayer() {
		return player;
	}

	public void setPlayer(Player player) {
		this.player = player;
	}

}
