package me.rhin.openciv.game.religion;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class PlayerReligion implements PickPantheonListener {

	private AbstractPlayer player;
	private ArrayList<ReligionBonus> pickedBonuses;

	public PlayerReligion(AbstractPlayer player) {
		this.player = player;
		this.pickedBonuses = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	public ArrayList<ReligionBonus> getPickedBonuses() {
		return pickedBonuses;
	}

	@Override
	public void onPickPantheon(PickPantheonPacket packet) {
		if (!player.getName().equals(packet.getPlayerName()))
			return;
		
		pickedBonuses.add(Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getPantheonFromID(packet.getReligionBonusID()));
	}

	public ArrayList<City> getFollowerCities() {
		ArrayList<City> followerCities = new ArrayList<>();

		for (City city : player.getOwnedCities()) {
			if (city.getCityReligion().getMajorityReligion().equals(this))
				followerCities.add(city);
		}

		return followerCities;
	}

	public AbstractPlayer getPlayer() {
		return player;
	}

}
