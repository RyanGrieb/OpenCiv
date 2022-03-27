package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;

public class GainFollowerEvent implements Event {

	private PlayerReligion playerReligion;
	private City city;
	private int oldAmount, newAmount;

	public GainFollowerEvent(PlayerReligion playerReligion, City city, int oldAmount, int newAmount) {
		this.playerReligion = playerReligion;
		this.city = city;
		this.oldAmount = oldAmount;
		this.newAmount = newAmount;
	}

	@Override
	public String getMethodName() {
		return "onGainFollower";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { playerReligion, city, oldAmount, newAmount };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { playerReligion.getClass(), city.getClass(), int.class, int.class };
	}

}
