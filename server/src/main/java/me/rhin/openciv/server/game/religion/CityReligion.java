package me.rhin.openciv.server.game.religion;

import java.util.HashMap;
import java.util.Map.Entry;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.listener.CityGainMajorityReligionListener.CityGainMajorityReligionEvent;
import me.rhin.openciv.server.listener.CityLooseMajorityReligionListener.CityLooseMajorityReligionEvent;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;

public class CityReligion {

	private City city;
	private HashMap<PlayerReligion, Integer> religionFollowers;

	public CityReligion(City city) {
		this.city = city;
		this.religionFollowers = new HashMap<>();
	}

	public PlayerReligion getMajorityReligion() {
		// FIXME: There is a better way to do this
		PlayerReligion majorityReligion = null;

		boolean noFollowers = true;
		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (religionFollowers.get(playerReligion) > 0)
				noFollowers = false;
		}

		// Return null if there are no active followers in this city.
		// Prevents us from returning a majorityReligion of 0.
		if (noFollowers)
			return null;

		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (majorityReligion == null
					|| religionFollowers.get(playerReligion) > religionFollowers.get(majorityReligion))
				majorityReligion = playerReligion;
		}

		return majorityReligion;
	}

	public void setFollowers(PlayerReligion playerReligion, int amount) {
		// Note, if the amount of followers to be added is > total religionFollowers,
		// remove followers from other religions.

		PlayerReligion oldMajority = getMajorityReligion();

		religionFollowers.put(playerReligion, amount);

		PlayerReligion newMajority = getMajorityReligion();

		if (oldMajority == null || !oldMajority.equals(newMajority)) {
			Server.getInstance().getEventManager().fireEvent(new CityGainMajorityReligionEvent(city, newMajority));

			Server.getInstance().getEventManager().fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));

			// FIXME: Only update this if the majority religion changes.
			city.updateWorkedTiles();
			city.getPlayerOwner().updateOwnedStatlines(false);

			CityReligionFollowersUpdatePacket packet = new CityReligionFollowersUpdatePacket();
			packet.setCityName(city.getName());

			for (Entry<PlayerReligion, Integer> entrySet : religionFollowers.entrySet()) {
				packet.addFollowerGroup(entrySet.getKey().getPlayer().getName(), entrySet.getValue());
			}

			Json json = new Json();

			for (Player player : Server.getInstance().getPlayers()) {
				player.sendPacket(json.toJson(packet));
			}

		}

	}
}
