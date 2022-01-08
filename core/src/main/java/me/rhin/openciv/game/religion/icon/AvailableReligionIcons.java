package me.rhin.openciv.game.religion.icon;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.FoundReligionListener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;

public class AvailableReligionIcons implements FoundReligionListener {

	private ArrayList<ReligionIcon> religionIcons;
	private ArrayList<ReligionIcon> availableIcons;

	public AvailableReligionIcons() {
		this.religionIcons = new ArrayList<>();
		this.availableIcons = new ArrayList<>();

		for (ReligionIcon icon : ReligionIcon.values()) {
			religionIcons.add(icon);
		}

		availableIcons.addAll(religionIcons);
		
		Civilization.getInstance().getEventManager().addListener(FoundReligionListener.class, this);
	}

	public ArrayList<ReligionIcon> getList() {
		return religionIcons;
	}

	public ArrayList<ReligionIcon> getAvailableIcons() {
		return availableIcons;
	}

	@Override
	public void onFoundReligion(FoundReligionPacket packet) {
		availableIcons.remove(religionIcons.get(packet.getIconID()));
	}
}
