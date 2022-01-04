package me.rhin.openciv.server.game.religion;

import java.util.HashMap;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class CityReligion implements PickPantheonListener {

	private City city;
	private HashMap<PlayerReligion, Integer> religionFollowers;

	public CityReligion(City city) {
		this.city = city;
		this.religionFollowers = new HashMap<>();

		Server.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	public PlayerReligion getMajorityReligion() {
		// FIXME: There is a better way to do this
		PlayerReligion majorityReligion = null;

		for (PlayerReligion playerReligion : religionFollowers.keySet()) {
			if (majorityReligion == null
					|| religionFollowers.get(playerReligion) > religionFollowers.get(majorityReligion))
				majorityReligion = playerReligion;
		}

		return majorityReligion;
	}

	@Override
	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet) {
		Player player = Server.getInstance().getPlayerByConn(conn);

		if (!city.getPlayerOwner().equals(player) || !player.getCapitalCity().equals(city))
			return;

		addFollowers(player.getReligion(), 1);
	}

	public void addFollowers(PlayerReligion playerReligion, int amount) {
		// Note, if the amount of followers to be added is > total religionFollowers,
		// remove followers from other religions.
		if (religionFollowers.get(playerReligion) == null)
			religionFollowers.put(playerReligion, amount);
		
		//FIXME: Only update this if the majority religion changes.
		city.updateWorkedTiles();
		city.getPlayerOwner().updateOwnedStatlines(false);
	}

}
