package me.rhin.openciv.game.religion.bonus;

import me.rhin.openciv.game.player.AbstractPlayer;

public class ReligionBonus {

	private ReligionBonusType bonusType;
	private AbstractPlayer player;
	
	public ReligionBonus(ReligionBonusType bonusType) {
		this.bonusType = bonusType;
	}

	public ReligionBonusType getBonusType() {
		return bonusType;
	}

	public AbstractPlayer getPlayer() {
		return player;
	}

	public void setPlayer(AbstractPlayer player) {
		this.player = player;
	}
}
