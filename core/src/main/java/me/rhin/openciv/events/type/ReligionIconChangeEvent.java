package me.rhin.openciv.events.type;

import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.shared.listener.Event;

public class ReligionIconChangeEvent implements Event {

	private PlayerReligion playerReligion;
	private ReligionIcon religionIcon;

	public ReligionIconChangeEvent(PlayerReligion playerReligion, ReligionIcon religionIcon) {
		this.playerReligion = playerReligion;
		this.religionIcon = religionIcon;
	}

	@Override
	public String getMethodName() {
		return "onReligionIconChange";
	}

	@Override

	public Object[] getMethodParams() {
		return new Object[] { playerReligion, religionIcon };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { playerReligion.getClass(), religionIcon.getClass() };
	}

}
