package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.PlayerReligion;
import me.rhin.openciv.shared.listener.Event;

public class LooseFollowerEvent implements Event {

	private PlayerReligion otherReligion;
	private City city;
	private int oldFollowerCount, otherReligionFollowers;

	public LooseFollowerEvent(PlayerReligion otherReligion, City city, int oldFollowerCount,
			int otherReligionFollowers) {
		this.otherReligion = otherReligion;
		this.city = city;
		this.oldFollowerCount = oldFollowerCount;
		this.otherReligionFollowers = otherReligionFollowers;
	}

	@Override
	public String getMethodName() {

		return "onLooseFollower";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { otherReligion, city, oldFollowerCount, otherReligionFollowers };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { otherReligion.getClass(), city.getClass(), int.class, int.class };
	}

}
