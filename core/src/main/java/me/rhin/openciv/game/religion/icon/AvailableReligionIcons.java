package me.rhin.openciv.game.religion.icon;

import java.util.ArrayList;

public class AvailableReligionIcons {

	private ArrayList<ReligionIcon> religionIcons;

	public AvailableReligionIcons() {
		this.religionIcons = new ArrayList<>();

		for (ReligionIcon icon : ReligionIcon.values()) {
			religionIcons.add(icon);
		}
	}

	public ArrayList<ReligionIcon> getList() {
		return religionIcons;
	}
}
