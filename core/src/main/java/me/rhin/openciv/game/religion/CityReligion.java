package me.rhin.openciv.game.religion;

import java.util.ArrayList;
import java.util.HashMap;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.type.CityGainMajorityReligionEvent;
import me.rhin.openciv.events.type.CityLooseMajorityReligionEvent;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;

public class CityReligion implements Listener {

	private City city;
	private HashMap<PlayerReligion, Integer> religionFollowers;

	public CityReligion(City city) {
		this.city = city;
		this.religionFollowers = new HashMap<>();

		for (AbstractPlayer player : Civilization.getInstance().getGame().getPlayers().values()) {
			religionFollowers.put(player.getReligion(), 0);
		}

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onCityReligionFollowerUpdate(CityReligionFollowersUpdatePacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		for (int i = 0; i < packet.getPlayerNames().length; i++) {
			String playerName = packet.getPlayerNames()[i];

			// FIXME: Make this more efficient
			for (PlayerReligion playerReligion : religionFollowers.keySet()) {
				if (playerReligion.getPlayer().getName().equals(playerName)) {

					PlayerReligion oldMajority = getMajorityReligion();
					religionFollowers.put(playerReligion, packet.getFollowers()[i]);
					PlayerReligion newMajority = getMajorityReligion();

					if (oldMajority != null && newMajority == null) {
						Civilization.getInstance().getEventManager()
								.fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));
					}

					if (newMajority != null && (oldMajority == null || !oldMajority.equals(newMajority))) {

						Civilization.getInstance().getEventManager()
								.fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));

						Civilization.getInstance().getEventManager()
								.fireEvent(new CityGainMajorityReligionEvent(city, newMajority));
					}
				}
			}
		}
	}

	public PlayerReligion getMajorityReligion() {
		// List in order of smallest to Greatest
		ArrayList<PlayerReligion> topReligions = new ArrayList<>();
		topReligions.addAll(religionFollowers.keySet());

		boolean noFollowers = true;
		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (getFollowersOfReligion(playerReligion) > 0)
				noFollowers = false;
		}

		// Return null if there are no active followers in this city.
		// Prevents us from returning a majorityReligion of 0.
		if (noFollowers)
			return null;

		for (int i = 1; i < topReligions.size(); i++) {
			PlayerReligion religion = topReligions.get(i);
			int j = i - 1;

			// If the next element is > than previous. Move it up once.
			while (j >= 0 && getFollowersOfReligion(topReligions.get(j)) > getFollowersOfReligion(religion)) {
				topReligions.set(j + 1, topReligions.get(j));
				j -= 1;
			}

			topReligions.set(j + 1, religion);
		}

		// If the top two religions are the same amount, return null.
		if (topReligions.size() > 1
				&& getFollowersOfReligion(topReligions.get(topReligions.size() - 1)) == getFollowersOfReligion(
						topReligions.get(topReligions.size() - 2)))
			return null;

		return topReligions.get(topReligions.size() - 1);
	}

	public HashMap<PlayerReligion, Integer> getMap() {
		return religionFollowers;
	}

	public int getBelieverCount() {

		int count = 0;
		for (int num : religionFollowers.values()) {
			count += num;
		}

		return count;
	}

	public int getFollowersOfReligion(PlayerReligion religion) {
		if (!religionFollowers.containsKey(religion))
			return 0;

		return religionFollowers.get(religion);
	}
}
