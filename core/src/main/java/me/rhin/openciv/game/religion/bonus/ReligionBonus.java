package me.rhin.openciv.game.religion.bonus;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.ReligionProperty;

public abstract class ReligionBonus {

	private static int idIndex = 0;

	private int id;

	public ReligionBonus() {
		id = idIndex++;
	}

	protected AbstractPlayer player;

	public abstract TextureEnum getIcon();

	public abstract String getName();

	public abstract ReligionProperty getProperty();

	public abstract String getDesc();

	public void setPlayer(AbstractPlayer player) {
		this.player = player;
	}

	public AbstractPlayer getPlayer() {
		return player;
	}

	public int getID() {
		return id;
	}
}
