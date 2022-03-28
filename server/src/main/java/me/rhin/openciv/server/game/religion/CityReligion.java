package me.rhin.openciv.server.game.religion;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map.Entry;

import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.events.type.CityGainMajorityReligionEvent;
import me.rhin.openciv.server.events.type.CityLooseMajorityReligionEvent;
import me.rhin.openciv.server.events.type.GainFollowerEvent;
import me.rhin.openciv.server.events.type.LooseFollowerEvent;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.packet.type.CityReligionFollowersUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;

public class CityReligion {

	private City city;
	private HashMap<PlayerReligion, Integer> religionFollowers;

	public CityReligion(City city) {
		this.city = city;
		this.religionFollowers = new HashMap<>();
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

		// If the top two religions are the same amount, return null. No majority if
		// there is a tie.
		if (topReligions.size() > 1
				&& getFollowersOfReligion(topReligions.get(topReligions.size() - 1)) == getFollowersOfReligion(
						topReligions.get(topReligions.size() - 2)))
			return null;

		return topReligions.get(topReligions.size() - 1);
	}

	// TODO: Make private?
	public void setFollowers(PlayerReligion playerReligion, int amount) {
		religionFollowers.put(playerReligion, amount);
	}

	public void addFollowers(PlayerReligion playerReligion, int amount) {

		PlayerReligion oldMajority = getMajorityReligion();

		int oldPlayerReligionFollowerCount = getFollowersOfReligion(playerReligion);
		int atheistsToConvert = (int) city.getStatLine().getStatValue(Stat.POPULATION) - getBelieverCount();

		if (amount - atheistsToConvert > 0) {
			// Subtract 1 follower from each religion unit we satisfy amount
			int hereticsToConvert = amount - atheistsToConvert;

			while (hereticsToConvert > 0 && getBelieverCountExcluding(playerReligion) > 0) {
				for (PlayerReligion otherReligion : religionFollowers.keySet()) {
					if (otherReligion.equals(playerReligion) || getFollowersOfReligion(otherReligion) < 1)
						continue;

					int oldFollowerCount = getFollowersOfReligion(otherReligion);

					// Subtract 1 from other religion
					setFollowers(otherReligion, getFollowersOfReligion(otherReligion) - 1);

					Server.getInstance().getEventManager().fireEvent(new LooseFollowerEvent(otherReligion, city,
							oldFollowerCount, getFollowersOfReligion(otherReligion)));

					hereticsToConvert--;

					if (hereticsToConvert < 1)
						break;
				}
			}
		}

		// Note: We clamp here, since getFollowersOfReligion(playerReligion) + amount
		// can be > than the cities population
		setFollowers(playerReligion, MathUtils.clamp(getFollowersOfReligion(playerReligion) + amount, 0,
				(int) city.getStatLine().getStatValue(Stat.POPULATION)));

		int newPlayerReligionFollowerCount = getFollowersOfReligion(playerReligion);

		Server.getInstance().getEventManager().fireEvent(new GainFollowerEvent(playerReligion, city,
				oldPlayerReligionFollowerCount, newPlayerReligionFollowerCount));

		PlayerReligion newMajority = getMajorityReligion();

		// LOGGER.info(oldMajority + "," + newMajority);

		if (oldMajority != null && newMajority == null) {
			Server.getInstance().getEventManager().fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));
			city.updateWorkedTiles();
			city.getPlayerOwner().updateOwnedStatlines(false);
		}

		if (newMajority != null && (oldMajority == null || !oldMajority.equals(newMajority))) {

			Server.getInstance().getEventManager().fireEvent(new CityGainMajorityReligionEvent(city, newMajority));

			if (oldMajority != null)
				Server.getInstance().getEventManager().fireEvent(new CityLooseMajorityReligionEvent(city, oldMajority));

			city.updateWorkedTiles();
			city.getPlayerOwner().updateOwnedStatlines(false);
		}
	}

	public void sendFollowerUpdatePacket() {
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

	private int getBelieverCountExcluding(PlayerReligion playerReligion) {

		int count = 0;
		for (Entry<PlayerReligion, Integer> entrySet : religionFollowers.entrySet()) {
			if (entrySet.getKey().equals(playerReligion))
				continue;

			count += entrySet.getValue();
		}

		return count;
	}
}
