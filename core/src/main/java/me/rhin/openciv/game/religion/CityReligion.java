package me.rhin.openciv.game.religion;

import java.util.HashMap;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.listener.CityGainMajorityReligionListener.CityGainMajorityReligionEvent;
import me.rhin.openciv.listener.CityLooseMajorityReligionListener.CityLooseMajorityReligionEvent;
import me.rhin.openciv.listener.CityReligionFollowersUpdateListener;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;

public class CityReligion implements CityReligionFollowersUpdateListener {

	private City city;
	private HashMap<PlayerReligion, Integer> religionFollowers;

	public CityReligion(City city) {
		this.city = city;
		this.religionFollowers = new HashMap<>();

		for (AbstractPlayer player : Civilization.getInstance().getGame().getPlayers().values()) {
			religionFollowers.put(player.getReligion(), 0);
		}

		Civilization.getInstance().getEventManager().addListener(CityReligionFollowersUpdateListener.class, this);
	}

	@Override
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

					if (oldMajority == null || !oldMajority.equals(newMajority)) {
						Civilization.getInstance().getEventManager()
								.fireEvent(new CityGainMajorityReligionEvent(city, newMajority));

						Civilization.getInstance().getEventManager()
								.fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));
					}
				}
			}
		}

	}

	public PlayerReligion getMajorityReligion() {
		// FIXME: There is a better way to do this
		PlayerReligion majorityReligion = null;

		boolean noFollowers = true;
		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (religionFollowers.get(playerReligion) > 0)
				noFollowers = false;
		}

		//Return null if there are no active followers in this city.
		//Prevents us from returning a majorityReligion of 0.
		if (noFollowers)
			return null;

		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (majorityReligion == null
					|| religionFollowers.get(playerReligion) > religionFollowers.get(majorityReligion))
				majorityReligion = playerReligion;
		}

		return majorityReligion;
	}
}
