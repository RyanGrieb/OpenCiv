package me.rhin.openciv.game.religion.bonus;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.ReligionProperty;

public abstract class ReligionBonus {

	private static int pantheonIndex = 0;
	private static int founderIndex = 0;
	private static int followerIndex = 0;

	private int id;

	public ReligionBonus() {

		switch (getProperty()) {
		case FOLLOWER_BELIEF:
			id = followerIndex++;
			break;
		case FOUNDER_BELIEF:
			id = founderIndex++;
			break;
		case PANTHEON:
			id = pantheonIndex++;
			break;
		}
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
